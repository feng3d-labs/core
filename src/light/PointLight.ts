import { Entity, RegisterComponent } from '@feng3d/ecs';
import { Vector2 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { PerspectiveLens } from '../cameras/lenses/PerspectiveLens';
import { EntityFactory } from '../EntityFactory';
import { AddComponentMenu } from '../Menu';
import { Light } from './Light';
import { LightType } from './LightType';

declare global
{
    interface MixinsPrimitiveEntity { 'Point light': Entity; }
    interface MixinsComponentMap { PointLight: PointLight; }
}

/**
 * 点光源
 */
@AddComponentMenu('Rendering/PointLight')
@RegisterComponent({ name: 'PointLight' })
export class PointLight extends Light
{
    __class__: 'feng3d.PointLight';

    lightType = LightType.Point;

    /**
     * 光照范围
     */
    @oav()
    @serialize
    get range()
    {
        return this._range;
    }
    set range(v)
    {
        if (this._range === v) return;
        this._range = v;
        this.invalidRange();
    }
    private _range = 10;

    /**
     * 阴影图尺寸
     */
    get shadowMapSize()
    {
        return this.shadowMap.getSize().multiply(new Vector2(1 / 4, 1 / 2));
    }

    constructor()
    {
        super();
        this.shadowCamera.lens = new PerspectiveLens(90, 1, 0.1, this.range);
    }

    private invalidRange()
    {
        if (this.shadowCamera)
        { this.shadowCamera.lens.far = this.range; }
    }
}

EntityFactory.registerPrimitive('Point light', (g) =>
{
    g.addComponent(PointLight);
});
