import { EventEmitter, IEvent } from '@feng3d/event';
import { Rectangle } from '@feng3d/math';
import { Lazy, lazy } from '@feng3d/polyfill';
import { windowEventProxy } from '@feng3d/shortcut';
import { watch } from '@feng3d/watcher';
import { Camera } from '../cameras/Camera';
import { MouseEventMap } from '../ecs/MouseEventMap';
import { raycaster } from '../pick/Raycaster';
import { Scene } from '../scene/Scene';
import { Transform } from './Transform';
import { View } from './View';

/**
 * 鼠标事件管理
 */
export class Mouse3DManager
{
    @watch('_mouseInputChanged')
    mouseInput: MouseInput;

    get selectedTransform()
    {
        return this._selectedTransform;
    }
    set selectedTransform(v)
    {
        this.setSelectedNode3D(v);
    }

    /**
     * 视窗，鼠标在该矩形内时为有效事件
     */
    viewport: Lazy<Rectangle>;

    /**
     * 拾取
     * @param scene 场景
     * @param _camera 摄像机
     */
    pick(view: View, scene: Scene, _camera: Camera)
    {
        if (this._mouseEventTypes.length === 0) return;
        // 计算得到鼠标射线相交的物体
        const pickingCollisionVO = raycaster.pick(view.mouseRay3D, scene.mouseCheckObjects);

        const node3d = pickingCollisionVO?.node3d;

        return node3d;
    }

    constructor(mouseInput: MouseInput, viewport?: Lazy<Rectangle>)
    {
        //
        this.mouseInput = mouseInput;
        this.viewport = viewport;
    }

    private _selectedTransform: Transform;
    private _mouseEventTypes: string[] = [];

    /**
     * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
     */
    private preMouseDownNode3D: Transform;
    /**
     * 统计处理click次数，判断是否达到dblclick
     */
    private node3DClickNum: number;

    private _mouseInputChanged(_property: string, oldValue: MouseInput, newValue: MouseInput)
    {
        if (oldValue)
        {
            mouseEventTypes.forEach((element) =>
            {
                oldValue.off(element, this.onMouseEvent, this);
            });
        }
        if (newValue)
        {
            mouseEventTypes.forEach((element) =>
            {
                newValue.on(element, this.onMouseEvent, this);
            });
        }
    }

    private dispatch(type)
    {
        if (this.viewport)
        {
            const bound = lazy.getvalue(this.viewport);
            if (!bound.contains(windowEventProxy.clientX, windowEventProxy.clientY))
            { return; }
        }

        if (this._mouseEventTypes.indexOf(type) === -1)
        { this._mouseEventTypes.push(type); }
    }

    /**
     * 监听鼠标事件收集事件类型
     */
    private onMouseEvent(event: IEvent<any>)
    {
        this.dispatch(event.type);
    }

    /**
     * 设置选中对象
     */
    private setSelectedNode3D(value: Transform)
    {
        if (this._selectedTransform !== value)
        {
            if (this._selectedTransform)
            { this._selectedTransform.emit('mouseout', null, true); }
            if (value)
            { value.emit('mouseover', null, true); }
        }
        this._selectedTransform = value;
        this._mouseEventTypes.forEach((element) =>
        {
            switch (element)
            {
                case 'mousedown':
                    if (this.preMouseDownNode3D !== this._selectedTransform)
                    {
                        this.node3DClickNum = 0;
                        this.preMouseDownNode3D = this._selectedTransform;
                    }
                    this._selectedTransform && this._selectedTransform.emit(element, null, true);
                    break;
                case 'mouseup':
                    if (this._selectedTransform === this.preMouseDownNode3D)
                    {
                        this.node3DClickNum++;
                    }
                    else
                    {
                        this.node3DClickNum = 0;
                        this.preMouseDownNode3D = null;
                    }
                    this._selectedTransform && this._selectedTransform.emit(element, null, true);
                    break;
                case 'mousemove':
                    this._selectedTransform && this._selectedTransform.emit(element, null, true);
                    break;
                case 'click':
                    if (this.node3DClickNum > 0)
                    { this._selectedTransform && this._selectedTransform.emit(element, null, true); }
                    break;
                case 'dblclick':
                    if (this.node3DClickNum > 1)
                    {
                        this._selectedTransform && this._selectedTransform.emit(element, null, true);
                        this.node3DClickNum = 0;
                    }
                    break;
            }
        });
        this._mouseEventTypes.length = 0;
    }
}

/**
 * 鼠标事件输入
 */
export class MouseInput<T = MouseEventMap> extends EventEmitter<T>
{
    /**
     * 是否启动
     */
    enable = true;

    /**
     * 是否捕获鼠标移动
     */
    catchMouseMove = false;

    /**
     * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
     * @param type 事件的类型。类型区分大小写。
     * @param data 事件携带的自定义数据。
     * @param bubbles 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
     */
    emit<K extends keyof T & string>(type: K, data?: T[K], bubbles = false)
    {
        if (!this.enable)
        {
            return null;
        }
        if (!this.catchMouseMove && type === 'mousemove')
        {
            return null;
        }

        return super.emit(type, data, bubbles);
    }

    /**
     * 派发事件
     * @param event 事件对象
     */
    emitEvent<K extends keyof T & string>(event: IEvent<T[K]>)
    {
        if (!this.enable)
        {
            return event;
        }
        if (!this.catchMouseMove && event.type === 'mousemove')
        {
            return event;
        }

        return super.emitEvent(event);
    }
}

/**
 * 鼠标事件列表
 */
const mouseEventTypes: (keyof MouseEventMap)[]
    = [
        'mouseout',
        'mouseover',
        'mousemove',
        'mousedown',
        'mouseup',
        'click',
        'middlemousedown',
        'middlemouseup',
        'middleclick',
        'rightmousedown',
        'rightmouseup',
        'rightclick',
        'dblclick',
    ];

/**
 * Window鼠标事件输入
 */
export class WindowMouseInput extends MouseInput
{
    constructor()
    {
        super();
        windowEventProxy.on('click', this.onMouseEvent, this);
        windowEventProxy.on('dblclick', this.onMouseEvent, this);
        windowEventProxy.on('mousedown', this.onMouseEvent, this);
        windowEventProxy.on('mouseup', this.onMouseEvent, this);
        windowEventProxy.on('mousemove', this.onMouseEvent, this);
    }

    /**
     * 监听鼠标事件收集事件类型
     */
    private onMouseEvent(event: IEvent<MouseEvent>)
    {
        let type = event.type;
        // 处理鼠标中键与右键
        if (event.data instanceof MouseEvent)
        {
            if (['click', 'mousedown', 'mouseup'].indexOf(event.type) !== -1)
            {
                type = ['', 'middle', 'right'][event.data.button] + event.type;
            }
        }

        this.emit(type as any, { mouseX: event.data.clientX, mouseY: event.data.clientY });
    }
}
