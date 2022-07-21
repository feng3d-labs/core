import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { shaderConfig } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';

declare global
{
    export interface MixinsUniformsTypes
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

shaderConfig.shaders['color'].cls = ColorUniforms;
