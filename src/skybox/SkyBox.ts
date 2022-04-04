import { oav } from '@feng3d/objectview';
import { RenderAtomic } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { RegisterComponent } from '../component/Component';
import { Component3D } from '../component/Component3D';
import { AddComponentMenu } from '../Menu';
import { Scene } from '../scene/Scene';
import { TextureCube } from '../textures/TextureCube';

declare global
{
    interface MixinsComponentMap { SkyBox: SkyBox; }
}

/**
 * 天空盒组件
 */
@AddComponentMenu('SkyBox/SkyBox')
@RegisterComponent({ name: 'SkyBox' })
export class SkyBox extends Component3D
{
    __class__: 'feng3d.SkyBox';

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyboxTexture: TextureCube = TextureCube.default;

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene, _camera: Camera)
    {
        renderAtomic.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
    }
}
