import { oav } from '@feng3d/objectview';
import { shaderlib } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { TextureCube } from '../textures/TextureCube';
import skyboxVertex from '../shaders/skybox.vertex.glsl';
import skyboxFragment from '../shaders/skybox.fragment.glsl';

export interface UniformsTypes { skybox: SkyBoxUniforms }
export class SkyBoxUniforms
{
    __class__: 'feng3d.SkyBoxUniforms';

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyboxTexture = TextureCube.default;
}

shaderlib.shaderConfig.shaders.skybox = { fragment: skyboxFragment, vertex: skyboxVertex, cls: SkyBoxUniforms };
