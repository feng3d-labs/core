import { Constructor } from '@feng3d/polyfill';
import { Transform } from '../core/Transform';
import { Component, RegisterComponent } from '../ecs/Component';

/**
 * 3D组件
 *
 * 所有基于3D空间的组件均可继承于该组件。
 */
@RegisterComponent({ name: 'Component3D', dependencies: [Transform] })
export class Component3D extends Component
{
    /**
     * The Node3D attached to this Entity (null if there is none attached).
     *
     * 附加到此 Entity 的 Node3D。
     */
    get node3d()
    {
        return this._gameObject?.getComponent(Transform);
    }

    /**
     * Returns all components of Type type in the Entity.
     *
     * 返回 Entity 或其任何子项中类型为 type 的所有组件。
     *
     * @param type 类定义
     * @returns         返回与给出类定义一致的组件
     */
    getComponentsInChildren<T extends Component>(type?: Constructor<T>, filter?: (compnent: T) => { findchildren: boolean, value: boolean }, result?: T[]): T[]
    {
        return this.node3d.getComponentsInChildren(type, filter, result);
    }

    /**
     * 从父类中获取组件
     * @param type 类定义
     * @returns         返回与给出类定义一致的组件
     */
    getComponentsInParents<T extends Component>(type?: Constructor<T>, result?: T[]): T[]
    {
        return this.node3d.getComponentsInParents(type, result);
    }
}
