import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { RunEnvironment } from '../core/RunEnvironment';
import { RegisterComponent } from '../ecs/Component';
import { Component3D } from './Component3D';

declare global
{
    interface MixinsComponentMap { Behaviour: Behaviour; }
}

/**
 * 行为
 *
 * 可以控制开关的组件
 */
@RegisterComponent({ name: 'Behaviour' })
export class Behaviour extends Component3D
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
        const v = this.enabled && this.node3d?.globalVisible;

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
