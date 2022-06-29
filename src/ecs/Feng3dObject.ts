import { EventEmitter } from '@feng3d/event';
import { Quaternion, Vector3 } from '@feng3d/math';
import { Constructor, mathUtil } from '@feng3d/polyfill';
import { serialization, serialize } from '@feng3d/serialization';
import { Transform } from '../core/Transform';
import { HideFlags } from './HideFlags';

export interface Feng3dObjectEventMap
{
    /**
     * 销毁事件。当对象将被销毁是发射销毁事件。
     */
    destroy: Feng3dObject;
}

/**
 * Base class for all objects feng3d can reference.
 *
 * @see https://docs.unity3d.com/2021.3/Documentation/ScriptReference/Object.html
 */
/**
 * feng3d 可以引用的所有对象的基类。
 *
 * @see https://docs.unity3d.com/2021.3/Documentation/ScriptReference/Object.html
 */
export class Feng3dObject<T extends Feng3dObjectEventMap = Feng3dObjectEventMap> extends EventEmitter<T>
{
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
     * Should the object be hidden, saved with the Scene or modifiable by the user?
     */
    /**
     * 对象应该隐藏、与场景一起保存还是可由用户修改？
     */
    @serialize
    hideFlags = HideFlags.None;

    /**
     * 通用唯一标识符（Universally Unique Identifier）
     */
    private _instanceID = mathUtil.uuid();

    /**
     * 是否已销毁
     */
    get isDestroyed() { return this._isDestroyed; }
    protected _isDestroyed = false;

    /**
     * 对象库
     */
    private static objectLib = new Map<string, Feng3dObject>();

    /**
     * 构建
     *
     * 新增不可修改属性 guid
     */
    constructor()
    {
        super();
        Feng3dObject.objectLib.set(this._instanceID, this);
    }

    /**
     * Gets the instance ID of the object.
     *
     * The instance ID of an object is always unique.
     *
     * @return Returns the instance ID of the object.
     */
    /**
     * 获取对象的实例 ID。
     *
     * 对象的实例 ID 始终是唯一的。
     *
     * @return 返回对象的实例 ID。
     */
    GetInstanceID()
    {
        return this._instanceID;
    }

    /**
     * 销毁对象。
     *
     * @param allowDestroyingAssets 是否允许销毁资产。
     */
    destroy(allowDestroyingAssets = false)
    {
        Feng3dObject.objectLib.delete(this._instanceID);
        this._isDestroyed = true;
        this.bubbles('destroy', this);
        allowDestroyingAssets;
    }

    /**
     * Removes a GameObject, component or asset.
     *
     * The object obj is destroyed immediately after the current Update loop, or t seconds from now if a time is specified. If obj is a Component, this method removes the component from the GameObject and destroys it. If obj is a GameObject, it destroys the GameObject, all its components and all transform children of the GameObject. Actual object destruction is always delayed until after the current Update loop, but is always done before rendering.
     *
     * Note: When destroying MonoBehaviour scripts, Unity calls OnDisable and OnDestroy before the script is removed.
     *
     * @param object The object to destroy.
     * @param t The optional amount of time to delay before destroying the object.
     */
    /**
     * 移除游戏对象、组件或资产。
     *
     * 该对象在当前更新循环后立即销毁，t如果指定时间，则从现在几秒后销毁。如果是Component，则此方法从GameObject中删除该组件并销毁它。如果是GameObject，它会销毁 GameObject 、它的所有组件以及GameObject的所有变换子项。实际的对象销毁总是延迟到当前更新循环之后，但总是在渲染之前完成。
     *
     * 注意：销毁 MonoBehaviour 脚本时，Unity 在删除脚本之前调用 OnDisable 和 OnDestroy。
     *
     * @param object 要破坏的对象。
     * @param t 在销毁对象之前延迟的可选时间量，单位为秒。
     */
    static Destroy(object: Feng3dObject, t = 0.0)
    {
        t;
        this.DestroyImmediate(object);
    }

    /**
     * Destroys the object obj immediately. You are strongly recommended to use Destroy instead.
     *
     * This function should only be used when writing editor code since the delayed destruction will never be invoked in edit mode. In game code you should use Object.Destroy instead. Destroy is always delayed (but executed within the same frame). Use this function with care since it can destroy assets permanently! Also note that you should never iterate through arrays and destroy the elements you are iterating over. This will cause serious problems (as a general programming practice, not just in Unity).
     *
     * @param obj Object to be destroyed.
     * @param allowDestroyingAssets Set to true to allow assets to be destroyed.
     */
    /**
     * 立即销毁对象obj。强烈建议您改用 Destroy。
     *
     * 这个函数应该只在编写编辑器代码时使用，因为在编辑模式下永远不会调用延迟销毁。在游戏代码中，您应该改用Object.Destroy。销毁总是延迟的（但在同一帧内执行）。小心使用此功能，因为它会永久破坏资产！另请注意，您永远不应该遍历数组并破坏您正在迭代的元素。这将导致严重的问题（作为一般的编程实践，不仅仅是在 Unity 中）。
     *
     * @param object 要销毁的对象。
     * @param allowDestroyingAssets 是否允许销毁资产。
     */
    static DestroyImmediate(object: Feng3dObject, allowDestroyingAssets = false)
    {
        object.destroy(allowDestroyingAssets);
    }

    // /**
    //  * Do not destroy the target Object when loading a new Scene.
    //  *
    //  * The load of a new Scene destroys all current Scene objects. Call Object.DontDestroyOnLoad to preserve an Object during scene loading. If the target Object is a component or GameObject, Unity also preserves all of the Transform’s children. Object.DontDestroyOnLoad only works for root GameObjects or components on root GameObjects. Object.DontDestroyOnLoad does not return a value.
    //  *
    //  * @param _target An Object not destroyed on Scene change.
    //  */
    // /**
    //  * 加载新场景时不要破坏目标对象。
    //  *
    //  * 新场景的加载会破坏所有当前场景对象。调用Object.DontDestroyOnLoad以在场景加载期间保留对象。如果目标 Object 是一个组件或GameObject，Unity 也会保留Transform的所有子对象。Object.DontDestroyOnLoad仅适用于根 GameObjects 或根 GameObjects 上的组件。 Object.DontDestroyOnLoad不返回值。
    //  *
    //  * @param _target 场景更改时未销毁的对象。
    //  */
    // static DontDestroyOnLoad(_target: Feng3dObject)
    // {

    // }

    /**
     * 获取所有加载的指定类型对象的列表。
     *
     * @param type 要查找的对象的类型。
     * @param includeInactive 如果为 true，则还包括附加到非活动游戏对象的组件。
     * @returns 找到的与指定类型匹配的对象数组。
     */
    /**
     * Gets a list of all loaded objects of Type type.
     *
     * @param type The type of object to find.
     * @param includeInactive If true, components attached to inactive GameObjects are also included.
     * @returns The array of objects found matching the type specified.
     */
    static FindObjectOfType<T extends Feng3dObject>(type?: Constructor<T>): T
    {
        const objects = this.FindObjectsOfType(type);
        if (objects.length > 0)
        {
            return objects[0];
        }

        return null;
    }

    /**
     * 获取所有加载的指定类型对象的列表。
     *
     * @param type 要查找的对象的类型。
     * @returns 找到的与指定类型匹配的对象数组。
     */
    /**
     * Gets a list of all loaded objects of Type type.
     *
     * @param type The type of object to find.
     * @returns The array of objects found matching the type specified.
     */
    static FindObjectsOfType<T extends Feng3dObject>(type?: Constructor<T>): T[]
    {
        const results: T[] = [];
        this.objectLib.forEach((value: T) =>
        {
            if (!type)
            {
                results.push(value);
            }
            else if (value instanceof type)
            {
                results.push(value);
            }
        });

        return results;
    }

    /**
     * Clones the object original and returns the clone.
     *
     * This function makes a copy of an object in a similar way to the Duplicate command in the editor. If you are cloning a GameObject you can specify its position and rotation (these default to the original GameObject's position and rotation otherwise). If you are cloning a Component the GameObject it is attached to is also cloned, again with an optional position and rotation.
     *
     * When you clone a GameObject or Component, all child objects and components are also cloned with their properties set like those of the original object.
     *
     * @param original An existing object that you want to make a copy of.
     *
     * @returns The instantiated clone.
     */
    /**
     * 克隆对象original并返回克隆。
     *
     * 此功能以与编辑器中的复制命令类似的方式复制对象。如果你正在克隆一个游戏对象，你可以指定它的位置和旋转（这些默认为原始游戏对象的位置和旋转，否则）。如果您正在克隆一个组件，它所附加的游戏对象也会被克隆，同样具有可选的位置和旋转。
     *
     * 当您克隆GameObject或Component时，所有子对象和组件也会被克隆，其属性设置与原始对象的属性设置相同。
     *
     * @param original 要复制的现有对象。
     *
     * @returns 实例化的克隆。
     */
    static Instantiate<T extends Feng3dObject>(original: T,
        { position = undefined, rotation = undefined, parent = undefined, instantiateInWorldSpace = false }: {
            /**
             * Position for the new object.
             */
            /**
             * 新对象的位置。
             */
            position: Vector3,
            /**
             * Orientation of the new object.
             */
            /**
             * 新对象的方向。
             */
            rotation: Quaternion,
            /**
             * Parent that will be assigned to the new object.
             */
            /**
             * 将分配给新对象的父级。
             */
            parent: Transform,
            /**
             * When you assign a parent Object, pass true to position the new object directly in world space. Pass false to set the Object’s position relative to its new parent.
             */
            /**
             * 分配父对象时，传递 true 以将新对象直接定位在世界空间中。传递 false 以设置对象相对于其新父对象的位置。
             */
            instantiateInWorldSpace: boolean
        }): T
    {
        original; position; rotation; parent; instantiateInWorldSpace;

        throw `未实现`;

        return null;
    }
}

serialization.serializeHandlers.push(
    // 处理 Feng3dObject
    {
        priority: 0,
        handler(_target, source, property)
        {
            const spv = source[property];
            if (spv instanceof Feng3dObject && (spv.hideFlags & HideFlags.DontSave))
            {
                return true;
            }

            return false;
        }
    },
);

