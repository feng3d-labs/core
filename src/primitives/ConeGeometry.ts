import { MeshRenderer } from '../core/MeshRenderer';
import { Entity } from '../ecs/Entity';
import { EntityFactory } from '../EntityFactory';
import { Geometry } from '../geometry/Geometry';
import { CylinderGeometry } from './CylinderGeometry';

/**
 * 圆锥体

 */
export class ConeGeometry extends CylinderGeometry
{
    __class__: 'feng3d.ConeGeometry' = 'feng3d.ConeGeometry';

    protected _name = 'Cone';

    /**
     * 底部半径 private
     */
    topRadius = 0;

    /**
     * 顶部是否封口 private
     */
    topClosed = false;

    /**
     * 侧面是否封口 private
     */
    surfaceClosed = true;
}

Geometry.setDefault('Cone', new ConeGeometry());

EntityFactory.registerPrimitive('Cone', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Cone');
});

declare global
{
    interface MixinsDefaultGeometry
    {
        Cone: ConeGeometry;
    }
    interface MixinsPrimitiveEntity
    {
        Cone: Entity;
    }
}
