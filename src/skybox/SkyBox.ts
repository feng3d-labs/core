import { oav } from '@feng3d/objectview';
import { RenderAtomic } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { RegisterComponent, Component } from '../component/Component';
import { AddComponentMenu } from '../Menu';
import { Scene } from '../scene/Scene';
import { TextureCube } from '../textures/TextureCube';

declare global
{
    export interface MixinsComponentMap
    {
        SkyBox: SkyBox;
    }
}

/**
 * 天空盒组件
 */
@AddComponentMenu('SkyBox/SkyBox')
@RegisterComponent()
export class SkyBox extends Component
{
    __class__: 'feng3d.SkyBox';

    // /**
    //  * The material used by the skybox.
    //  */
    // @serialize
    // material: Material;

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyboxTexture = TextureCube.default;

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene, _camera: Camera)
    {
        renderAtomic.uniforms.s_skyboxTexture = () => this.s_skyboxTexture;
    }
}
