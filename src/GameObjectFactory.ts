import { gPartial } from '@feng3d/polyfill';
import { serialization } from '@feng3d/serialization';
import { Transform } from './core/Transform';
import { GameObject } from './ecs/GameObject';

export class GameObjectFactory
{
    /**
     * 创建指定类型的实体。
     *
     * @param type 实体类型。
     * @param param 实体参数。
     */
    static createPrimitive<K extends keyof MixinsPrimitiveEntity>(type: K, param?: gPartial<GameObject>)
    {
        const g = new GameObject();
        g.name = type;

        const createHandler = this._registerPrimitives[type];
        if (createHandler !== null) createHandler(g);

        serialization.setValue(g, param);

        return g.getComponent(Transform);
    }

    /**
     * 注册原始实体，被注册后可以使用 Entity.createPrimitive 进行创建。
     *
     * @param type 原始实体类型。
     * @param handler 构建原始实体的函数。
     */
    static registerPrimitive<K extends keyof MixinsPrimitiveEntity>(type: K, handler: (entity: GameObject) => void)
    {
        if (this._registerPrimitives[type])
        { console.warn(`重复注册原始实体 ${type} ！`); }
        this._registerPrimitives[type] = handler;
    }
    static _registerPrimitives: { [type: string]: (gameObject: GameObject) => void } = {};
}

declare global
{
    interface MixinsPrimitiveEntity
    {
    }
}
