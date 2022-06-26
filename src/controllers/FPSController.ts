import { IEvent as Event } from '@feng3d/event';
import { Vector2, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { ObjectUtils } from '@feng3d/polyfill';
import { windowEventProxy } from '@feng3d/shortcut';
import { Behaviour } from '../component/Behaviour';
import { RunEnvironment } from '../core/RunEnvironment';
import { RegisterComponent } from '../ecs/Component';
import { AddComponentMenu } from '../Menu';

declare global
{
    interface MixinsComponentMap { FPSController: FPSController; }
}
/**
 * FPS模式控制器
 */
@AddComponentMenu('Controller/FPSController')
@RegisterComponent({ name: 'FPSController' })
export class FPSController extends Behaviour
{
    /**
     * 加速度
     */
    @oav()
    public acceleration = 0.001;

    runEnvironment = RunEnvironment.feng3d;

    /**
     * 按键记录
     */
    private keyDownDic: { [key: string]: boolean };

    /**
     * 按键方向字典
     */
    private keyDirectionDic: { [key: string]: Vector3 };

    /**
     * 速度
     */
    private velocity: Vector3;

    /**
     * 上次鼠标位置
     */
    private preMousePoint: Vector2 | null;

    private ischange = false;

    private _auto: boolean;
    get auto()
    {
        return this._auto;
    }
    set auto(value)
    {
        if (this._auto === value)
        { return; }
        if (this._auto)
        {
            windowEventProxy.off('mousedown', this.onMousedown, this);
            windowEventProxy.off('mouseup', this.onMouseup, this);
            this.onMouseup();
        }
        this._auto = value;
        if (this._auto)
        {
            windowEventProxy.on('mousedown', this.onMousedown, this);
            windowEventProxy.on('mouseup', this.onMouseup, this);
        }
    }

    init()
    {
        super.init();

        this.keyDirectionDic = {};
        this.keyDirectionDic.a = new Vector3(-1, 0, 0);// 左
        this.keyDirectionDic.d = new Vector3(1, 0, 0);// 右
        this.keyDirectionDic.w = new Vector3(0, 0, 1);// 前
        this.keyDirectionDic.s = new Vector3(0, 0, -1);// 后
        this.keyDirectionDic.e = new Vector3(0, 1, 0);// 上
        this.keyDirectionDic.q = new Vector3(0, -1, 0);// 下

        this.keyDownDic = {};

        this.auto = true;
    }

    onMousedown()
    {
        this.ischange = true;

        this.preMousePoint = null;
        this.mousePoint = null;
        this.velocity = new Vector3();
        this.keyDownDic = {};

        windowEventProxy.on('keydown', this.onKeydown, this);
        windowEventProxy.on('keyup', this.onKeyup, this);
        windowEventProxy.on('mousemove', this.onMouseMove, this);
    }

    onMouseup()
    {
        this.ischange = false;
        this.preMousePoint = null;
        this.mousePoint = null;

        windowEventProxy.off('keydown', this.onKeydown, this);
        windowEventProxy.off('keyup', this.onKeyup, this);
        windowEventProxy.off('mousemove', this.onMouseMove, this);
    }

    /**
     * 销毁
     */
    dispose()
    {
        this.auto = false;
    }

    /**
     * 手动应用更新到目标3D对象
     */
    update(): void
    {
        if (!this.ischange)
        { return; }

        if (this.mousePoint && this.preMousePoint)
        {
            // 计算旋转
            const offsetPoint = this.mousePoint.subTo(this.preMousePoint);
            offsetPoint.x *= 0.15;
            offsetPoint.y *= 0.15;
            // this.targetObject.node3d.rotate(Vector3.X_AXIS, offsetPoint.y, this.targetObject.node3d.position);
            // this.targetObject.node3d.rotate(Vector3.Y_AXIS, offsetPoint.x, this.targetObject.node3d.position);

            const matrix = this.node3d.localToWorldMatrix;
            matrix.appendRotation(matrix.getAxisX(), offsetPoint.y, matrix.getPosition());
            const up = Vector3.Y_AXIS.clone();
            if (matrix.getAxisY().dot(up) < 0)
            {
                up.scaleNumber(-1);
            }
            matrix.appendRotation(up, offsetPoint.x, matrix.getPosition());
            this.node3d.localToWorldMatrix = matrix;
            //
            this.preMousePoint = this.mousePoint;
            this.mousePoint = null;
        }

        // 计算加速度
        const accelerationVec = new Vector3();
        for (const key in this.keyDirectionDic)
        {
            if (this.keyDownDic[key] === true)
            {
                const element = this.keyDirectionDic[key];
                accelerationVec.add(element);
            }
        }
        accelerationVec.scaleNumber(this.acceleration);
        // 计算速度
        this.velocity.add(accelerationVec);
        const right = this.node3d.matrix.getAxisX();
        const up = this.node3d.matrix.getAxisY();
        const forward = this.node3d.matrix.getAxisZ();
        right.scaleNumber(this.velocity.x);
        up.scaleNumber(this.velocity.y);
        forward.scaleNumber(this.velocity.z);
        // 计算位移
        const displacement = right.clone();
        displacement.add(up);
        displacement.add(forward);
        this.node3d.x += displacement.x;
        this.node3d.y += displacement.y;
        this.node3d.z += displacement.z;
    }
    private mousePoint: Vector2 | null;
    /**
     * 处理鼠标移动事件
     */
    private onMouseMove(event: Event<MouseEvent>)
    {
        this.mousePoint = new Vector2(event.data.clientX, event.data.clientY);

        if (ObjectUtils.objectIsEmpty(this.preMousePoint))
        {
            this.preMousePoint = this.mousePoint;
            this.mousePoint = null;
        }
    }

    /**
     * 键盘按下事件
     */
    private onKeydown(event: Event<KeyboardEvent>): void
    {
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
        if (ObjectUtils.objectIsEmpty(this.keyDirectionDic[boardKey]))
        { return; }

        if (!this.keyDownDic[boardKey])
        { this.stopDirectionVelocity(this.keyDirectionDic[boardKey]); }
        this.keyDownDic[boardKey] = true;
    }

    /**
     * 键盘弹起事件
     */
    private onKeyup(event: Event<KeyboardEvent>): void
    {
        const boardKey = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
        if (ObjectUtils.objectIsEmpty(this.keyDirectionDic[boardKey]))
        { return; }

        this.keyDownDic[boardKey] = false;
        this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
    }

    /**
     * 停止xyz方向运动
     * @param direction 停止运动的方向
     */
    private stopDirectionVelocity(direction: Vector3)
    {
        if (ObjectUtils.objectIsEmpty(direction))
        { return; }
        if (direction.x !== 0)
        {
            this.velocity.x = 0;
        }
        if (direction.y !== 0)
        {
            this.velocity.y = 0;
        }
        if (direction.z !== 0)
        {
            this.velocity.z = 0;
        }
    }
}
