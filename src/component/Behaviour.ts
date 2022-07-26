import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { RunEnvironment } from '../core/RunEnvironment';
import { RegisterComponent, Component } from './Component';

declare global
{
    export interface MixinsComponentMap
    {
        Behaviour: Behaviour;
    }
}

/**
 * 行为
 *
 * 可以控制开关的组件
 */
@RegisterComponent()
export class Behaviour extends Component
{
    /**
     * 是否启用update方法
     */
    @oav()
    @serialize
    enabled = true;

    /**
     * 可运行环境
     */
    runEnvironment = RunEnvironment.all;

    /**
     * Has the Behaviour had enabled called.
     * 是否所在GameObject显示且该行为已启动。
     */
    get isVisibleAndEnabled()
    {
        const v = this.enabled && this.gameObject && this.gameObject.activeSelf;

        return v;
    }

    /**
     * 每帧执行
     */
    update(_interval?: number)
    {
    }

    dispose()
    {
        this.enabled = false;
        super.dispose();
    }
}
