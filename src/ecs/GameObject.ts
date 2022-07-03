import { IEventTarget } from '@feng3d/event';
import { oav } from '@feng3d/objectview';
import { Constructor, decoratorRegisterClass, ObjectUtils } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Transform } from '../core/Transform';
import { Scene } from '../scene/Scene';
import { Component, ComponentMap, ComponentNames } from './Component';
import { Feng3dObject, Feng3dObjectEventMap } from './Feng3dObject';
import { MouseEventMap } from './MouseEventMap';

type Components = ComponentMap[ComponentNames];

export interface GameObjectEventMap extends MixinsEntityEventMap, MouseEventMap, Feng3dObjectEventMap
{

    /**
     * 添加了子对象，当child被添加到parent中时派发冒泡事件
     */
    addChild: { parent: GameObject, child: GameObject }

    /**
     * 删除了子对象，当child被parent移除时派发冒泡事件
     */
    removeChild: { parent: GameObject, child: GameObject };

    /**
     * 自身被添加到父对象中事件
     */
    added: { parent: GameObject };

    /**
     * 自身从父对象中移除事件
     */
    removed: { parent: GameObject };

    /**
     * 当GameObject的scene属性被设置是由Scene派发
     */
    addedToScene: GameObject;

    /**
     * 当GameObject的scene属性被清空时由Scene派发
     */
    removedFromScene: GameObject;

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

export interface GameObject extends MixinsNode3D
{

}

/**
 * Base class for all entities in feng3d Scenes.
 *
 * @see https://docs.unity3d.com/2021.3/Documentation/ScriptReference/GameObject.html
 */
/**
 * feng3d 场景中所有实体的基类。
 *
 * 第一个组件总是`Transform`。
 *
 * @see https://docs.unity3d.com/2021.3/Documentation/ScriptReference/GameObject.html
 */
@decoratorRegisterClass()
export class GameObject extends Feng3dObject<GameObjectEventMap> implements IEventTarget
{
    __class__: 'GameObject';

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
    get scene()
    {
        return this._scene;
    }
    private _scene: Scene;

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
     * 组件列表
     */
    protected _components: Components[] = [];

    /**
     * 是否显示
     */
    @serialize
    get visible()
    {
        return this._visible;
    }
    set visible(v)
    {
        if (this._visible === v) return;
        this._visible = v;
        this._invalidateGlobalVisible();
    }
    private _visible = true;

    /**
     * 全局是否可见
     */
    get globalVisible()
    {
        if (this._globalVisibleInvalid)
        {
            this._updateGlobalVisible();
            this._globalVisibleInvalid = false;
        }

        return this._globalVisible;
    }
    protected _globalVisible = false;
    protected _globalVisibleInvalid = true;

    get parent()
    {
        return this._parent;
    }

    /**
     * The Transform attached to this GameObject.
     */
    /**
     * 附加到此游戏对象的变换。
     */
    get transform(): Transform
    {
        return this._components[0] as Transform;
    }
    /**
     * The number of children the parent Transform has.
     */
    /**
     * 父 Transform 拥有的子代数。
     */
    get numChilren()
    {
        return this._children.length;
    }

    /**
     * 子对象
     */
    @serialize
    get children()
    {
        return this._children.concat();
    }

    set children(value)
    {
        if (!value) return;
        for (let i = this._children.length - 1; i >= 0; i--)
        {
            this.removeChildAt(i);
        }
        for (let i = 0; i < value.length; i++)
        {
            this.addChild(value[i]);
        }
    }

    protected _parent: GameObject;
    protected _children: GameObject[] = [];

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
        this.addComponent(Transform);
        components.forEach((v) =>
        {
            this.addComponent(v);
        });
    }

    /**
     * 是否包含指定对象
     *
     * @param child 可能的子孙对象
     */
    contains(child: GameObject)
    {
        let checkitem = child;
        do
        {
            if (checkitem === this)
            {
                return true;
            }
            checkitem = checkitem.parent;
        } while (checkitem);

        return false;
    }

    /**
     * 添加子对象
     *
     * @param child 子对象
     */
    addChild(child: GameObject)
    {
        if (ObjectUtils.objectIsEmpty(child))
        { return; }
        if (child.parent === this)
        {
            // 把子对象移动到最后
            const childIndex = this._children.indexOf(child);
            if (childIndex !== -1) this._children.splice(childIndex, 1);
            this._children.push(child);
        }
        else
        {
            if (child.contains(this))
            {
                console.error('无法添加到自身中!');

                return;
            }
            if (child._parent) child._parent.removeChild(child);
            child._setParent(this);
            this._children.push(child);
            child.emit('added', { parent: this });
            this.emit('addChild', { child, parent: this }, true);
        }

        return child;
    }

    /**
     * 添加子对象
     *
     * @param children 子对象
     */
    addChildren(...children: GameObject[])
    {
        for (let i = 0; i < children.length; i++)
        {
            this.addChild(children[i]);
        }
    }

    /**
     * 移除自身
     */
    remove()
    {
        if (this.parent) this.parent.removeChild(this);
    }

    /**
     * 移除所有子对象
     */
    removeChildren()
    {
        for (let i = this.numChilren - 1; i >= 0; i--)
        {
            this.removeChildAt(i);
        }
    }

    /**
     * 移除子对象
     *
     * @param child 子对象
     */
    removeChild(child: GameObject)
    {
        if (ObjectUtils.objectIsEmpty(child)) return;
        const childIndex = this._children.indexOf(child);
        if (childIndex !== -1) this.removeChildInternal(childIndex, child);
    }

    /**
     * 删除指定位置的子对象
     *
     * @param index 需要删除子对象的所有
     */
    removeChildAt(index: number)
    {
        const child = this._children[index];

        return this.removeChildInternal(index, child);
    }

    /**
     * 获取指定位置的子对象
     *
     * @param index
     */
    getChildAt(index: number)
    {
        return this._children[index];
    }

    /**
     * 获取子对象列表（备份）
     */
    getChildren()
    {
        return this._children.concat();
    }

    private _setParent(value: GameObject)
    {
        this._parent = value;
        this.updateScene();
        this.transform._invalidateSceneTransform();
    }

    private updateScene()
    {
        const newScene = this._parent?._scene;
        if (this._scene === newScene)
        { return; }
        if (this._scene)
        {
            this.emit('removedFromScene', this);
        }
        this._scene = newScene;
        if (this._scene)
        {
            this.emit('addedToScene', this);
        }
        this._updateChildrenScene();
    }

    /**
     * @private
     */
    private _updateChildrenScene()
    {
        for (let i = 0, n = this._children.length; i < n; i++)
        {
            this._children[i].updateScene();
        }
    }

    private removeChildInternal(childIndex: number, child: GameObject)
    {
        this._children.splice(childIndex, 1);
        child._setParent(null);

        child.emit('removed', { parent: this });
        this.emit('removeChild', { child, parent: this }, true);
    }

    /**
     * 是否加载完成
     */
    get isLoaded()
    {
        if (!this.isSelfLoaded) return false;
        for (let i = 0; i < this.children.length; i++)
        {
            const element = this.children[i];
            if (!element.isLoaded) return false;
        }

        return true;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onLoadCompleted(callback: () => void)
    {
        let loadingNum = 0;
        if (!this.isSelfLoaded)
        {
            loadingNum++;
            this.onSelfLoadCompleted(() =>
            {
                loadingNum--;
                if (loadingNum === 0) callback();
            });
        }
        for (let i = 0; i < this.children.length; i++)
        {
            const element = this.children[i];
            if (!element.isLoaded)
            {
                loadingNum++;
                // eslint-disable-next-line no-loop-func
                element.onLoadCompleted(() =>
                {
                    loadingNum--;
                    if (loadingNum === 0) callback();
                });
            }
        }
        if (loadingNum === 0) callback();
    }

    protected _updateGlobalVisible()
    {
        let visible = this.visible;
        if (this.parent)
        {
            visible = visible && this.parent.globalVisible;
        }
        this._globalVisible = visible;
    }

    protected _invalidateGlobalVisible()
    {
        if (this._globalVisibleInvalid) return;

        this._globalVisibleInvalid = true;

        this._children.forEach((c) =>
        {
            c._invalidateGlobalVisible();
        });
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
     * 返回游戏对象附加的一个指定类型的组件，如果没有，则返回 null。
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
        const component = this.getComponent(type);
        if (component)
        {
            return component;
        }

        for (let i = 0; i < this.numChilren; i++)
        {
            const gameObject = this.children[i];
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
     * Retrieves the component of Type type in the GameObject or any of its parents.
     *
     * This method recurses upwards until it finds a GameObject with a matching component. Only components on active GameObjects are matched.
     *
     * @param type Type of component to find.
     * @param includeInactive Should Components on inactive GameObjects be included in the found set?
     * @returns Returns a component if a component matching the type is found. Returns null otherwise.
     */
    /**
     * 检索GameObject或其任何父项type中的 Type 组件。
     *
     * 此方法向上递归，直到找到具有匹配组件的 GameObject。仅匹配活动游戏对象上的组件。
     *
     * @param type 要查找的组件类型。
     * @param includeInactive 是否包含不活跃组件。
     * @returns 如果找到与类型匹配的组件，则返回一个组件。否则返回 null。
     */
    getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        if (includeInactive || this.activeSelf)
        {
            const component = this.getComponent(type);
            if (component)
            {
                return component;
            }
        }

        if (this.parent)
        {
            const component = this.parent.getComponentInParent(type, includeInactive);
            if (component)
            {
                return component;
            }
        }

        return null;
    }

    /**
     * Returns all components of Type `type` in the GameObject.
     *
     * @param type The type of component to retrieve.
     * @param results List to receive the results.
     * @returns all components of Type type in the GameObject.
     */
    /**
     * 返回GameObject中指定类型的所有组件。
     *
     * @param type 要检索的组件类型。
     * @param results 列出接收找到的组件。
     * @returns GameObject中指定类型的所有组件。
     */
    getComponents<T extends Component>(type: Constructor<T>, results: T[] = []): T[]
    {
        for (let i = 0; i < this._components.length; i++)
        {
            const component = this._components[i];
            if (component instanceof type)
            {
                results.push(component);
            }
        }

        return results;
    }

    /**
     * Returns all components of Type type in the GameObject or any of its children children using depth first search. Works recursively.
     *
     * Unity searches for components recursively on child GameObjects. This means that it also includes all the child GameObjects of the target GameObject, and all subsequent child GameObjects.
     *
     * @param type The type of Component to retrieve.
     * @param includeInactive Should Components on inactive GameObjects be included in the found set?
     * @param results List to receive found Components.
     * @returns All found Components.
     */
    /**
     * 使用深度优先搜索返回 GameObject 或其任何子子项中 Type 的所有组件。递归工作。
     *
     * Unity 在子游戏对象上递归搜索组件。这意味着它还包括目标 GameObject 的所有子 GameObject，以及所有后续子 GameObject。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 非活动游戏对象上的组件是否应该包含在搜索结果中？
     * @param results 列出接收找到的组件。
     * @returns 所有找到的组件。
     */
    getComponentsInChildren<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        this.getComponents(type, results);

        for (let i = 0; i < this.children.length; i++)
        {
            const gameObject = this.children[i];
            if (!includeInactive && !gameObject.activeSelf) continue;
            gameObject.getComponentsInChildren(type, includeInactive, results);
        }

        return results;
    }

    /**
     * Returns all components of Type type in the GameObject or any of its parents.
     *
     * @param type The type of Component to retrieve.
     * @param includeInactive Should inactive Components be included in the found set?
     * @param results List holding the found Components.
     * @returns All components of Type type in the GameObject or any of its parents.
     */
    /**
     * 返回GameObject或其任何父级中指定的所有组件。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 非活动组件是否应该包含在搜索结果中？
     * @param results 列出找到的组件。
     * @returns GameObject或其任何父级中指定的所有组件。
     */
    getComponentsInParent<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        if (includeInactive || this.activeSelf)
        {
            this.getComponents(type, results);
        }

        if (this.parent)
        {
            this.parent.getComponentsInParent(type, includeInactive, results);
        }

        return results;
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
        return this._components[index];
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
        console.assert(this === component.gameObject, '只能移除在容器中的组件');

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
        component.destroy();

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
        console.assert(a.gameObject === this, '第一个子组件不在容器中');
        console.assert(b.gameObject === this, '第二个子组件不在容器中');

        this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
    }

    /**
     * 销毁
     */
    destroy()
    {
        for (let i = this._components.length - 1; i >= 0; i--)
        {
            this.removeComponentAt(i);
        }
        if (this.parent)
        {
            this.parent.removeChild(this);
        }
        for (let i = this._children.length - 1; i >= 0; i--)
        {
            this.removeChildAt(i);
        }
        super.destroy();
    }

    destroyWithChildren()
    {
        this.destroy();
        while (this.numChilren > 0)
        {
            this._children[0].destroy();
        }
    }

    /**
     * 根据名称查找对象
     *
     * @param name 对象名称
     */
    find(name: string): GameObject
    {
        if (this.name === name)
        {
            return this;
        }
        for (let i = 0; i < this._children.length; i++)
        {
            const target = this._children[i].find(name);
            if (target)
            {
                return target;
            }
        }

        return null;
    }

    /**
     * @private
     * @param v
     */
    _setScene(v: Scene)
    {
        this._scene = v;
        this._updateChildrenScene();
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
        const entitys = Feng3dObject.FindObjectsOfType(GameObject);
        const result = entitys.filter((v) => v.name === name);

        return result[0];
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

        if (component.gameObject === this)
        {
            index = Math.min(index, this._components.length - 1);
            this.setComponentIndex(component, index);

            return;
        }
        // 组件唯一时移除同类型的组件
        const type = component.constructor as Constructor<Component>;
        if (Component.isSingleComponent(type))
        {
            const oldComponents = this.getComponents(type);
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
     * 把事件分享到每个组件上。
     */
    getShareTargets()
    {
        return this.components;
    }

    /**
     * 把事件汇报给父结点。
     */
    getBubbleTargets()
    {
        const targets = [this.parent];

        return targets;
    }

    /**
     * 把事件广播给每个子结点。
     */
    getBroadcastTargets()
    {
        return this.children;
    }
}
