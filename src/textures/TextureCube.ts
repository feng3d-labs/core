import { FS } from '@feng3d/filesystem';
import { oav } from '@feng3d/objectview';
import { ArrayUtils } from '@feng3d/polyfill';
import { TextureType } from '@feng3d/renderer';
import { serialization, serialize } from '@feng3d/serialization';
import { watch } from '@feng3d/watcher';
import { AssetType } from '../assets/AssetType';
import { AssetData } from '../core/AssetData';
import { HideFlags } from '../core/HideFlags';
import { TextureInfo } from '../render/data/TextureInfo';
import { ImageDatas, Texture2D } from './Texture2D';

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

    assetType = AssetType.texturecube;

    static ImageNames: TextureCubeImageName[] = ['positive_x_url', 'positive_y_url', 'positive_z_url', 'negative_x_url', 'negative_y_url', 'negative_z_url'];

    @oav({ component: 'OAVCubeMap', priority: 1 })
    OAVCubeMap = '';

    /**
     * 原始数据
     */
    @serialize
    @watch('_rawDataChanged')
    rawData: { type: 'texture', textures: Texture2D[] } | { type: 'path', paths: string[] };

    noPixels = [ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white, ImageDatas.white];

    protected _pixels = [null, null, null, null, null, null];

    /**
     * 是否加载完成
     */
    get isLoaded() { return this._loading.length === 0; }
    private _loading = [];

    setTexture2D(pos: TextureCubeImageName, texture: Texture2D)
    {
        if (!this.rawData || this.rawData.type !== 'texture')
        {
            this.rawData = { type: 'texture', textures: [] };
        }
        const index = TextureCube.ImageNames.indexOf(pos);
        this.rawData.textures[index] = texture;

        this._loadItemTexture(texture, index);
    }

    setTexture2DPath(pos: TextureCubeImageName, path: string)
    {
        if (!this.rawData || this.rawData.type !== 'path')
        {
            this.rawData = { type: 'path', paths: [] };
        }
        const index = TextureCube.ImageNames.indexOf(pos);
        this.rawData.paths[index] = path;

        this._loadItemImagePath(path, index);
    }

    getTextureImage(pos: TextureCubeImageName, callback: (img?: HTMLImageElement) => void)
    {
        if (!this.rawData)
        {
            callback();

            return;
        }
        const index = TextureCube.ImageNames.indexOf(pos);
        if (this.rawData.type === 'texture')
        {
            const texture = this.rawData.textures[index];
            if (!texture)
            {
                callback();

                return;
            }
            texture.onLoadCompleted(() =>
            {
                callback(texture.image);
            });
        }
        else if (this.rawData.type === 'path')
        {
            const path = this.rawData.paths[index];
            if (!path)
            {
                callback();

                return;
            }
            FS.fs.readImage(path, (_err: Error, img: HTMLImageElement) =>
            {
                callback(img);
            });
        }
    }

    private _rawDataChanged()
    {
        if (!this.rawData) return;

        if (this.rawData.type === 'texture')
        {
            this.rawData.textures.forEach((v, index) =>
            {
                this._loadItemTexture(v, index);
            });
            this.invalidate();
        }
        else if (this.rawData.type === 'path')
        {
            this.rawData.paths.forEach((v, index) =>
            {
                this._loadItemImagePath(v, index);
            });
        }
    }

    /**
     * 加载单个贴图
     *
     * @param texture 贴图
     * @param index 索引
     */
    private _loadItemTexture(texture: Texture2D, index: number)
    {
        if (!texture) return;

        this._loading.push(texture);
        texture.onLoadCompleted(() =>
        {
            if (this.rawData.type === 'texture' && this.rawData.textures[index] === texture)
            {
                this._pixels[index] = texture.image;
                this.invalidate();
            }
            ArrayUtils.deleteItem(this._loading, texture);
            this._onItemLoadCompleted();
        });
    }

    /**
     * 加载单个图片
     *
     * @param imagepath 图片路径
     * @param index 索引
     */
    private _loadItemImagePath(imagepath: string, index: number)
    {
        if (!imagepath) return;

        this._loading.push(imagepath);
        FS.fs.readImage(imagepath, (_err, img) =>
        {
            if (img && this.rawData.type === 'path' && this.rawData.paths[index] === imagepath)
            {
                this._pixels[index] = img;
                this.invalidate();
            }
            ArrayUtils.deleteItem(this._loading, imagepath);
            this._onItemLoadCompleted();
        });
    }

    private _onItemLoadCompleted()
    {
        if (this._loading.length === 0) this.emit('loadCompleted');
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onLoadCompleted(callback: () => void)
    {
        if (this.isLoaded)
        {
            callback();

            return;
        }
        this.once('loadCompleted', callback);
    }

    static default: TextureCube;
}

TextureCube.default = serialization.setValue(new TextureCube(), { name: 'Default-TextureCube', hideFlags: HideFlags.NotEditable });

AssetData.addAssetData('Default-TextureCube', TextureCube.default);
