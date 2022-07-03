import { GameObject } from '../ecs/GameObject';

export class ControllerBase
{
    /**
     * 控制对象
     */
    protected _target: GameObject | undefined;

    /**
     * 控制器基类，用于动态调整3D对象的属性
     */
    constructor(target?: GameObject)
    {
        this.target = target;
    }

    /**
     * 手动应用更新到目标3D对象
     */
    update(_interpolate = true): void
    {
        throw new Error('Abstract method');
    }

    get target()
    {
        return this._target;
    }

    set target(val)
    {
        this._target = val;
    }
}
