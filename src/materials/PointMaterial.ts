import { Color4 } from '@feng3d/math';
import { shaderlib } from '@feng3d/renderer';
import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import pointVertex from '../shaders/point.vertex.glsl';
import pointFragment from '../shaders/point.fragment.glsl';

declare global
{
    interface MixinsUniformsTypes
    {
        point: PointUniforms
    }
}

export class PointUniforms
{
    __class__: 'feng3d.PointUniforms';
    /**
     * 颜色
     */
    @serialize
    @oav()
    u_color = new Color4();

    /**
     * 点绘制时点的尺寸
     */
    @serialize
    @oav()
    u_PointSize = 1;
}

shaderlib.shaderConfig.shaders.point = { fragment: pointFragment, vertex: pointVertex, cls: PointUniforms };
