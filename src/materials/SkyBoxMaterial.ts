import { oav } from '@feng3d/objectview';
import { shaderConfig } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { TextureCube } from '../textures/TextureCube';

export interface UniformsTypes { skybox: SkyBoxUniforms }
export class SkyBoxUniforms
{
    __class__: 'feng3d.SkyBoxUniforms';

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyboxTexture = TextureCube.default;
}

shaderConfig.shaders['skybox'].cls = SkyBoxUniforms;
