import { IEvent } from '@feng3d/event';
import { Constructor } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Feng3dObject } from './Feng3dObject';
import { GameObject, GameObjectEventMap } from './GameObject';

interface ComponentInfo
{
    /**
     * 组件名称，默认构造函数名称。当组件重名时可以使用该参数进行取别名，并且在接口 ComponentMap 中相应调整。
     */
    name: string;
    /**
     * 是否唯一，同类型组件只允许一个。
     */
    single: boolean;
    /**
     * 构造函数
     */
    type: Constructor<Component>;
    /**
     * 所依赖的组件列表。当该组件被添加Entity上时，会补齐缺少的依赖组件。
     */
    dependencies: Constructor<Component>[];
}

/**
 * 组件信息属性常量，保存组件名称与组件依赖ComponentInfo，由 @RegisterComponent 装饰器进行填充。
 */
const __component__ = '__component__';

/**
 * 注册组件
 *
 * 使用 @RegisterComponent 在组件类定义上注册组件，配合扩展 ComponentMap 接口后可使用 Entity.getComponent 等方法。
 *
 * @param component 组件名称，默认使用类名称
 */
export function RegisterComponent(component?: {
    /**
     * 组件名称，默认构造函数名称。当组件重名时可以使用该参数进行取别名，并且在接口 ComponentMap 中相应调整。
     */
    name: string,
    /**
     * 是否唯一，同类型组件只允许一个。
     */
    single?: boolean,
    /**
     * 所依赖的组件列表。当该组件被添加Entity上时，会补齐缺少的依赖组件。
     */
    dependencies?: Constructor<Component>[]
})
{
    return (constructor: Constructor<Component>) =>
    {
        component = component || <any>{};
        const info = component as ComponentInfo;
        info.name = info.name || component.name;
        info.type = constructor;
        info.dependencies = info.dependencies || [];
        constructor.prototype[__component__] = info;

        if (Component._componentMap[info.name])
        {
            console.warn(`重复定义组件${info.name}，${Component._componentMap[info.name]} ${constructor} ！`);
        }
        else
        {
            Component._componentMap[info.name] = constructor;
        }
    };
}

export function getComponentType<T extends ComponentNames>(type: T): Constructor<ComponentMap[T]>
{
    return Component._componentMap[type] as any;
}

/**
 * 组件名称与类定义映射，新建组件一般都需扩展该接口。
 */
export interface ComponentMap extends MixinsComponentMap
{
    Component: Component
}

export type ComponentNames = keyof ComponentMap;

/**
 * 组件
 *
 * 所有附加到Entity的基类。
 *
 * 注意，您的代码不会直接创建 Component，而是您编写脚本代码，然后将该脚本附加到 Entity。
 */
export class Component<T extends GameObjectEventMap = GameObjectEventMap> extends Feng3dObject<T>
{
    /**
     * 组件名称与类定义映射，由 @RegisterComponent 装饰器进行填充。
     * @private
     */
    static _componentMap: { [name: string]: Constructor<Component> } = {};

    /**
     * 获取组件依赖列表
     *
     * @param type 组件类定义
     */
    static getDependencies(type: Constructor<Component>)
    {
        let prototype = type.prototype;
        let dependencies: Constructor<Component>[] = [];
        while (prototype)
        {
            dependencies = dependencies.concat((prototype[__component__] as ComponentInfo)?.dependencies || []);
            prototype = prototype.__proto__;
        }

        return dependencies;
    }

    /**
     * 判断组件是否为唯一组件。
     *
     * @param type 组件类定义
     */
    static isSingleComponent<T extends Component>(type: Constructor<T>)
    {
        let prototype = type.prototype;
        let isSingle = false;
        while (prototype && !isSingle)
        {
            isSingle = !!((prototype[__component__] as ComponentInfo)?.single);
            prototype = prototype.__proto__;
        }

        return isSingle;
    }

    /**
     * The game object this component is attached to. A component is always attached to a game object.
     */
    /**
     * 此组件附加到的游戏对象。组件始终附加到游戏对象。
     */
    get gameObject()
    {
        return this._gameObject;
    }
    @serialize
    protected _gameObject: GameObject;

    /**
     * 此实体的标签。
     *
     * 可使用标签来识别实体。
     */
    get tag()
    {
        return this._gameObject.tag;
    }

    set tag(v)
    {
        this._gameObject.tag = v;
    }

    // ------------------------------------------
    // Functions
    // ------------------------------------------
    /**
     * 创建一个组件
     */
    constructor()
    {
        super();
        this.onAny(this._onAnyListener, this);
    }

    /**
     * 初始化组件
     *
     * 在添加到Entity时立即被调用。
     */
    init()
    {
    }

    /**
     * 销毁
     */
    dispose()
    {
        this._gameObject = null;
        this._disposed = true;
    }

    beforeRender(_renderAtomic: any, _scene: any, _camera: any)
    {

    }

    /**
     * 监听对象的所有事件并且传播到所有组件中
     */
    private _onAnyListener(e: IEvent<any>)
    {
        if (this._gameObject)
        { this._gameObject.emitEvent(e); }
    }

    /**
     * 该方法仅在Entity中使用
     * @private
     *
     * @param entity 实体
     */
    _setEntity(entity: GameObject)
    {
        this._gameObject = entity;
    }
}

