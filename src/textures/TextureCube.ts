import { oav } from '@feng3d/objectview';
import { TextureType } from '@feng3d/renderer';
import { serialization } from '@feng3d/serialization';
import { HideFlags } from '../ecs/HideFlags';
import { ImageDatas, TextureInfo } from '../render/data/TextureInfo';

export interface TextureCubeEventMap
{
    /**
     * 加载完成
     */
    loadCompleted: any;
}

export type TextureCubeImageName = 'positive_x_url' | 'positive_y_url' | 'positive_z_url' | 'negative_x_url' | 'negative_y_url' | 'negative_z_url';

/**
 * 立方体纹理
 */
export class TextureCube<T extends TextureCubeEventMap = TextureCubeEventMap> extends TextureInfo<T>
{
    __class__: 'feng3d.TextureCube';

    textureType = TextureType.TEXTURE_CUBE_MAP;

    static ImageNames: TextureCubeImageName[] = ['positive_x_url', 'positive_y_url', 'positive_z_url', 'negative_x_url', 'negative_y_url', 'negative_z_url'];

    @oav({ component: 'OAVCubeMap', priority: -1 })
    OAVCubeMap = '';

    noPixels = [ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white];

    protected _pixels = [null, null, null, null, null, null];

    static default: TextureCube;
}

TextureCube.default = serialization.setValue(new TextureCube(), { name: 'Default-TextureCube', hideFlags: HideFlags.NotEditable });
