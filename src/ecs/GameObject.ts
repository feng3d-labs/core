import { IEvent } from '@feng3d/event';
import { oav } from '@feng3d/objectview';
import { Constructor, ObjectUtils } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Transform } from '../core/Transform';
import { Scene } from '../scene/Scene';
import { Component, ComponentMap, ComponentNames } from './Component';
import { Feng3dObject } from './Feng3dObject';
import { MouseEventMap } from './MouseEventMap';

type Components = ComponentMap[ComponentNames];

export interface GameObjectEventMap extends MixinsEntityEventMap, MouseEventMap
{
    /**
     * 添加子组件事件
     */
    addComponent: { entity: GameObject, component: Component };

    /**
     * 移除子组件事件
     */
    removeComponent: { entity: GameObject, component: Component };

    // /**
    //  * 包围盒失效
    //  */
    // boundsInvalid: Geometry;

    /**
     * 刷新界面
     */
    refreshView: any;
}

/**
 * Base class for all entities in feng3d Scenes.
 *
 * @see https://docs.unity3d.com/2021.3/Documentation/ScriptReference/GameObject.html
 */
/**
 * feng3d 场景中所有实体的基类。
 *
 * @see https://docs.unity3d.com/2021.3/Documentation/ScriptReference/GameObject.html
 */
export class GameObject<T extends GameObjectEventMap = GameObjectEventMap> extends Feng3dObject<T>
{
    __class__: 'GameObject';

    /**
     * The name of the object.
     */
    /**
     * 对象的名称。
     */
    @serialize
    get name()
    {
        return this._name;
    }
    set name(v)
    {
        this._name = v;
    }
    protected _name: string;

    /**
     * Defines whether the GameObject is active in the Scene.
     */
    /**
     * 定义 GameObject 在场景中是否处于活动状态。
     */
    get activeInHierarchy()
    {
        return this.activeSelf;
    }

    /**
     * The local active state of this GameObject.
     */
    /**
     * 此游戏对象的本地活动状态
     */
    activeSelf = true;

    /**
     * Scene that the GameObject is part of.
     */
    /**
     * GameObject 所属的场景。
     */
    get scene(): Scene
    {
        return null;
    }

    /**
     * The tag of this game object.
     *
     * A tag can be used to identify a game object. Tags must be declared in the Tags and Layers manager before using them.
     */
    /**
     * 此游戏对象的标签。
     *
     * 标签可用于识别游戏对象。在使用标签之前，标签必须在标签和层管理器中声明。
     */
    @serialize
    tag: string;

    /**
     * The Transform attached to this GameObject.
     */
    /**
     * 附加到此游戏对象的变换。
     */
    get transform(): Transform
    {
        return this._transform;
    }
    private _transform: Transform;

    /**
     * Creates a new game object, named name.
     *
     * Transform is always added to the GameObject that is being created.
     *
     * @param name The name that the GameObject is created with.
     * @param components A list of Components to add to the GameObject on creation.
     */
    /**
     * 创建一个名为name的新游戏对象。
     *
     * 变换总是在GameObject创建时被添加。
     *
     * @param name 创建游戏对象的名称。
     * @param components Components创建时添加到游戏对象的列表。
     */
    constructor(name = 'GameObject', components: Constructor<Component>[] = [])
    {
        super();
        this.name = name;
        this._transform = this.addComponent(Transform);
        components.forEach((v) =>
        {
            this.addComponent(v);
        });

        this.onAny(this._onAnyListener, this);
    }

    /**
     * Adds a component class of type componentType to the game object.
     *
     * @param ComponentType A component class of type.
     * @returns The component that is added.
     */
    /**
     * Adds a component class of type componentType to the game object.
     *
     * @param ComponentType 组件类定义。
     * @returns 被添加的组件。
     */
    addComponent<T extends Component>(ComponentType: Constructor<T>): T
    {
        let component = this.getComponent(ComponentType);
        if (component && Component.isSingleComponent(ComponentType))
        {
            // alert(`The compnent ${param["name"]} can't be added because ${this.name} already contains the same component.`);
            return component;
        }
        const dependencies = Component.getDependencies(ComponentType);
        // 先添加依赖
        dependencies.forEach((dependency) =>
        {
            this.addComponent(dependency);
        });
        //
        component = new ComponentType();
        this.addComponentAt(component, this._components.length);

        return component;
    }

    /**
     * Returns the component of Type type if the game object has one attached, null if it doesn't.
     *
     * Using gameObject.GetComponent will return the first component that is found. If you expect there to be more than one component of the
     * same type, use gameObject.GetComponents instead, and cycle through the returned components testing for some unique property.
     *
     * @param type The type of Component to retrieve.
     * @returns The component to retrieve.
     */
    /**
     * 如果游戏对象附加了一个，则返回 Type 的组件，type如果没有，则返回 null。
     *
     * 使用 gameObject.GetComponent 将返回找到的第一个组件。如果您希望有多个相同类型的组件，请改用 gameObject.GetComponents，并循环通过返回的组件测试某些唯一属性。
     *
     * @param type 要检索的组件类型。
     * @returns 要检索的组件。
     */
    getComponent<T extends Component>(type: Constructor<T>): T
    {
        for (let i = 0; i < this._components.length; i++)
        {
            if (this._components[i] instanceof type)
            {
                return this._components[i] as T;
            }
        }

        return null;
    }

    /**
     * Returns the component of Type type in the GameObject or any of its children using depth first search.
     *
     * @param type The type of Component to retrieve.
     * @param includeInactive Should Components on inactive GameObjects be included in the found set?
     * @returns A component of the matching type, if found.
     */
    /**
     * 使用深度优先搜索返回 GameObject 或其任何子项中的 Type 组件。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 是否包含不活跃组件。
     * @returns 匹配类型的组件（如果找到）。
     */
    getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        for (let i = 0; i < this._components.length; i++)
        {
            const component = this._components[i];
            if (component instanceof type)
            {
                return component as T;
            }
        }

        for (let i = 0; i < this.transform.children.length; i++)
        {
            const gameObject = this.transform.children[i].gameObject;
            if (!includeInactive && !gameObject.activeSelf) continue;
            const compnent = gameObject.getComponentInChildren(type, includeInactive);
            if (compnent)
            {
                return compnent;
            }
        }

        return null;
    }

    /**
     * 从自身与子代（孩子，孩子的孩子，...）Entity 中获取所有指定类型的组件
     *
     * @param type 要检索的组件的类型。
     * @returns         返回与给出类定义一致的组件
     */
    getComponentsInChildren<T extends Component>(type?: Constructor<T>, filter?: (compnent: T) => {
        /**
         * 是否继续查找子项
         */
        findchildren: boolean,
        /**
         * 是否为需要查找的组件
         */
        value: boolean
    }, result?: T[]): T[]
    {
        result = result || [];
        let findchildren = true;
        const cls = type;
        const components = this.components;
        for (let i = 0, n = components.length; i < n; i++)
        {
            const item = components[i] as T;
            if (!cls)
            {
                result.push(item);
            }
            else if (item instanceof cls)
            {
                if (filter)
                {
                    const filterresult = filter(item);
                    filterresult && filterresult.value && result.push(item);
                    findchildren = filterresult ? (filterresult && filterresult.findchildren) : false;
                }
                else
                {
                    result.push(item);
                }
            }
        }
        if (findchildren)
        {
            for (let i = 0, n = this.transform.numChildren; i < n; i++)
            {
                this.transform.children[i].gameObject.getComponentsInChildren(type, filter, result);
            }
        }

        return result;
    }

    /**
     * 子组件个数
     */
    get numComponents()
    {
        return this._components.length;
    }

    @serialize
    @oav({ component: 'OAVComponentList' })
    get components()
    {
        return this._components.concat();
    }
    set components(value)
    {
        if (!value) return;
        for (let i = 0, n = value.length; i < n; i++)
        {
            const component = value[i];
            if (!component) continue;
            this.addComponentAt(value[i], this.numComponents);
        }
    }

    /**
     * 获取指定位置索引的子组件
     *
     * @param index 位置索引
     * @returns             子组件
     */
    getComponentAt(index: number): Component
    {
        console.assert(index < this.numComponents, '给出索引超出范围');

        return this._components[index];
    }

    // /**
    //  * 添加脚本
    //  *
    //  * @param script 脚本路径
    //  */
    // addScript(scriptName: string)
    // {
    //     const scriptComponent = new ScriptComponent();
    //     scriptComponent.scriptName = scriptName;
    //     this.addComponentAt(scriptComponent, this._components.length);

    //     return scriptComponent;
    // }

    /**
     * 获取实体上所有指定类型的组件数组
     *
     * @param type 类定义
     * @returns         返回与给出类定义一致的组件
     */
    getComponents<T extends Component>(type: Constructor<T>): T[]
    {
        console.assert(!!type, `类型不能为空！`);

        const cls = type;
        if (!cls)
        {
            console.warn(`无法找到 ${type.name} 组件类定义，请使用 @RegisterComponent() 在组件类上标记。`);

            return [];
        }
        const filterResult: any = this._components.filter((v) => v instanceof cls);

        return filterResult;
    }

    /**
     * 设置子组件的位置
     *
     * @param component 子组件
     * @param index 位置索引
     */
    setComponentIndex<T extends Component>(component: T, index: number): void
    {
        console.assert(index >= 0 && index < this.numComponents, '给出索引超出范围');

        const oldIndex = this._components.indexOf(component);
        console.assert(oldIndex >= 0 && oldIndex < this.numComponents, '子组件不在容器内');

        this._components.splice(oldIndex, 1);
        this._components.splice(index, 0, component);
    }

    /**
     * 设置组件到指定位置
     *
     * @param component 被设置的组件
     * @param index 索引
     */
    setComponentAt<T extends Component>(component: T, index: number)
    {
        if (this._components[index])
        {
            this.removeComponentAt(index);
        }
        this.addComponentAt(component, index);
    }

    /**
     * 移除组件
     *
     * @param component 被移除组件
     */
    removeComponent<T extends Component>(component: T): void
    {
        console.assert(this.hasComponent(component), '只能移除在容器中的组件');

        const index = this.getComponentIndex(component);
        this.removeComponentAt(index);
    }

    /**
     * 获取组件在容器的索引位置
     *
     * @param component 查询的组件
     * @returns                 组件在容器的索引位置
     */
    getComponentIndex<T extends Component>(component: T): number
    {
        console.assert(this._components.indexOf(component) !== -1, '组件不在容器中');

        const index = this._components.indexOf(component);

        return index;
    }

    /**
     * 移除组件
     *
     * @param index 要删除的 Component 的子索引。
     */
    removeComponentAt(index: number): Component
    {
        console.assert(index >= 0 && index < this.numComponents, '给出索引超出范围');

        const component: Component = this._components.splice(index, 1)[0];
        // 派发移除组件事件
        this.emit('removeComponent', { component, entity: this }, true);
        component.dispose();

        return component;
    }

    /**
     * 交换子组件位置
     *
     * @param index1 第一个子组件的索引位置
     * @param index2 第二个子组件的索引位置
     */
    swapComponentsAt(index1: number, index2: number): void
    {
        console.assert(index1 >= 0 && index1 < this.numComponents, '第一个子组件的索引位置超出范围');
        console.assert(index2 >= 0 && index2 < this.numComponents, '第二个子组件的索引位置超出范围');

        const temp = this._components[index1];
        this._components[index1] = this._components[index2];
        this._components[index2] = temp;
    }

    /**
     * 交换子组件位置
     *
     * @param a 第一个子组件
     * @param b 第二个子组件
     */
    swapComponents<T1 extends Component, T2 extends Component>(a: T1, b: T2): void
    {
        console.assert(this.hasComponent(a), '第一个子组件不在容器中');
        console.assert(this.hasComponent(b), '第二个子组件不在容器中');

        this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
    }

    /**
     * 获取指定类型组件
     *
     * @param type 组件类型
     */
    getComponentsByType<T extends Component>(type: Constructor<T>)
    {
        const removeComponents: T[] = [];
        for (let i = 0; i < this._components.length; i++)
        {
            if (this._components[i] instanceof type)
            { removeComponents.push(this._components[i] as any); }
        }

        return removeComponents;
    }

    /**
     * 移除指定类型组件
     *
     * @param type 组件类型
     */
    removeComponentsByType<T extends Component>(type: Constructor<T>)
    {
        const removeComponents: T[] = [];
        for (let i = this._components.length - 1; i >= 0; i--)
        {
            if (this._components[i].constructor === type)
            { removeComponents.push(this.removeComponentAt(i) as T); }
        }

        return removeComponents;
    }

    /**
     * 监听对象的所有事件并且传播到所有组件中
     */
    private _onAnyListener(e: IEvent<any>)
    {
        this.components.forEach((element: Component) =>
        {
            element.emitEvent(e);
        });
    }

    /**
     * 销毁
     */
    dispose()
    {
        for (let i = this._components.length - 1; i >= 0; i--)
        {
            this.removeComponentAt(i);
        }
        super.dispose();
    }

    // ------------------------------------------
    // Static Functions
    // ------------------------------------------
    /**
     * 查找指定名称的实体
     *
     * @param name
     */
    static find(name: string)
    {
        const entitys = Feng3dObject.getObjects(GameObject);
        const result = entitys.filter((v) => !v.disposed && (v.name === name));

        return result[0];
    }

    // ------------------------------------------
    // Protected Properties
    // ------------------------------------------
    /**
     * 组件列表
     */
    protected _components: Components[] = [];

    // ------------------------------------------
    // Protected Functions
    // ------------------------------------------

    // ------------------------------------------
    // Private Properties
    // ------------------------------------------

    // ------------------------------------------
    // Private Methods
    // ------------------------------------------

    /**
     * 判断是否拥有组件
     *
     * @param com 被检测的组件
     * @returns     true：拥有该组件；false：不拥有该组件。
     */
    private hasComponent<T extends Component>(com: T): boolean
    {
        return this._components.indexOf(com) !== -1;
    }

    /**
     * 添加组件到指定位置
     *
     * @param component 被添加的组件
     * @param index 插入的位置
     */
    private addComponentAt<T extends Component>(component: T, index: number): void
    {
        if (ObjectUtils.objectIsEmpty(component))
        { return; }
        console.assert(index >= 0 && index <= this.numComponents, '给出索引超出范围');

        if (this.hasComponent(component))
        {
            index = Math.min(index, this._components.length - 1);
            this.setComponentIndex(component, index);

            return;
        }
        // 组件唯一时移除同类型的组件
        const type = component.constructor as Constructor<Component>;
        if (Component.isSingleComponent(type))
        {
            const oldComponents = this.getComponentsByType(type);
            if (oldComponents.length > 0)
            {
                console.assert(oldComponents.length === 1);
                this.removeComponent(oldComponents[0]);
            }
        }

        this._components.splice(index, 0, component);
        component._setEntity(this);
        component.init();
        // 派发添加组件事件
        this.emit('addComponent', { component, entity: this }, true);
    }

    /**
     * Returns the name of the object.
     *
     * @return The name returned by ToString.
     */
    /**
     * 返回对象的名称。
     *
     * @return ToString 返回的名称。
     */
    ToString()
    {
        return this._name;
    }

    // /**
    //  * 为了兼容以往json序列化格式
    //  *
    //  * @deprecated
    //  */
    // // eslint-disable-next-line accessor-pairs
    // set children(v: Entity[])
    // {
    //     const node3ds = v.map((v) => v.getComponent(Node3D));
    //     const node3d = this.getComponent(Node3D);
    //     if (node3d)
    //     {
    //         node3d.children = node3ds;
    //     }
    //     else
    //     {
    //         const f = (e: IEvent<{
    //             entity: Entity;
    //             component: Component;
    //         }>) =>
    //         {
    //             if (e.data.entity === this && e.data.component instanceof Node3D)
    //             {
    //                 e.data.component.children = node3ds;
    //                 this.off('addComponent', f);
    //             }
    //         };
    //         this.on('addComponent', f);
    //     }
    //     this._children = v;
    // }
    // // debug
    // private _children: Entity[];
}
