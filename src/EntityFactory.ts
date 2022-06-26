import { gPartial } from '@feng3d/polyfill';
import { serialization } from '@feng3d/serialization';
import { Camera } from './cameras/Camera';
import { MeshRenderer } from './core/MeshRenderer';
import { Node3D } from './core/Node3D';
import { Entity } from './ecs/Entity';
import { Geometry } from './geometry/Geometry';
import { SegmentGeometry } from './geometry/SegmentGeometry';
import { DirectionalLight } from './light/DirectionalLight';
import { PointLight } from './light/PointLight';
import { SpotLight } from './light/SpotLight';
import { Material } from './materials/Material';

export class EntityFactory
{
    /**
     * 创建指定类型的实体。
     *
     * @param type 实体类型。
     * @param param 实体参数。
     */
    static createPrimitive<K extends keyof MixinsPrimitiveEntity>(type: K, param?: gPartial<Entity>)
    {
        const g = new Entity();
        g.name = type;

        const createHandler = this._registerPrimitives[type];
        if (createHandler !== null) createHandler(g);

        serialization.setValue(g, param);

        return g.getComponent(Node3D);
    }

    /**
     * 注册原始实体，被注册后可以使用 Entity.createPrimitive 进行创建。
     *
     * @param type 原始实体类型。
     * @param handler 构建原始实体的函数。
     */
    static registerPrimitive<K extends keyof MixinsPrimitiveEntity>(type: K, handler: (entity: Entity) => void)
    {
        if (this._registerPrimitives[type])
        { console.warn(`重复注册原始实体 ${type} ！`); }
        this._registerPrimitives[type] = handler;
    }
    static _registerPrimitives: { [type: string]: (gameObject: Entity) => void } = {};
}

declare global
{
    interface MixinsPrimitiveEntity
    {
    }
}
