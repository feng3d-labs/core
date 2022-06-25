import { Color4 } from '@feng3d/math';
import { shaderlib } from '@feng3d/renderer';
import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import colorVertex from '../shaders/color.vertex.glsl';
import colorFragment from '../shaders/color.fragment.glsl';

declare global
{
    interface MixinsUniformsTypes
    {
        color: ColorUniforms
    }
}

export class ColorUniforms
{
    __class__: 'feng3d.ColorUniforms';
    /**
     * 颜色
     */
    @serialize
    @oav()
    u_diffuseInput = new Color4();
}

shaderlib.shaderConfig.shaders.color = { fragment: colorFragment, vertex: colorVertex, cls: ColorUniforms };
