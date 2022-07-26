import { EventEmitter } from '@feng3d/event';
import { Constructor, IDisposable, mathUtil } from '@feng3d/polyfill';
import { serialization, serialize } from '@feng3d/serialization';
import { HideFlags } from './HideFlags';

export interface Feng3dObjectEventMap
{
    /**
     * 销毁事件。当对象将被销毁是发射销毁事件。
     */
    // destroy: Feng3dObject;
}

/**
 * 所有feng3d对象的基类
 */
export class Feng3dObject<T extends Feng3dObjectEventMap = Feng3dObjectEventMap> extends EventEmitter<T> implements IDisposable
{
    /**
     * 名称
     */
    name: string;

    /**
     * 隐藏标记，用于控制是否在层级界面、检查器显示，是否保存
     */
    @serialize
    hideFlags = HideFlags.None;

    /**
     * 通用唯一标识符（Universally Unique Identifier）
     */
    readonly uuid: string;

    /**
     * 是否已销毁
     */
    get disposed() { return this._disposed; }
    protected _disposed = false;

    /**
     * 构建
     *
     * 新增不可修改属性 guid
     */
    constructor()
    {
        super();
        Object.defineProperty(this, 'uuid', { value: mathUtil.uuid() });
        Object.defineProperty(this, 'disposed', { value: false, configurable: true });
        console.assert(!Feng3dObject.objectLib[this.uuid], `唯一标识符存在重复！？`);
        Feng3dObject.objectLib[this.uuid] = this;
    }

    /**
     * 销毁
     */
    dispose()
    {
        Object.defineProperty(this, 'disposed', { value: true, configurable: false });
    }

    /**
     * 获取对象
     *
     * @param uuid 通用唯一标识符
     */
    static getObject(uuid: string)
    {
        return this.objectLib[uuid];
    }

    /**
     * 获取对象
     *
     * @param type
     */
    static getObjects<T extends Feng3dObject>(type?: Constructor<T>): T[]
    {
        const objects = Object.keys(this.objectLib).map((v) => this.objectLib[v]);
        //
        let filterResult = objects;
        if (type)
        {
            filterResult = objects.filter((v) => v instanceof type);
        }

return <T[]>filterResult;
    }

    /**
     * 对象库
     */
    private static objectLib: { [guid: string]: Feng3dObject };
}
Object.defineProperty(Feng3dObject, 'objectLib', { value: {} });

serialization.serializeHandlers.push(
    // 处理 Feng3dObject
    {
        priority: 0,
        handler (target, source, property)
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

