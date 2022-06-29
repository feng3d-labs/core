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
    get transform()
    {
        return this._gameObject?.getComponent(Transform);
    }
}
