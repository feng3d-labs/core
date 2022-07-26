import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { RegisterComponent, Component } from './Component';

declare global
{
    export interface MixinsComponentMap
    {
        WireframeComponent: WireframeComponent;
    }
}

/**
 * 线框组件，将会对拥有该组件的对象绘制线框
 */
@RegisterComponent()
export class WireframeComponent extends Component
{
    __class__: 'feng3d.WireframeComponent';

    @oav()
    color = new Color4(125 / 255, 176 / 255, 250 / 255);
}
