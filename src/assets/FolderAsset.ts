import { ov } from '@feng3d/objectview';
import { AssetType } from './AssetType';
import { FileAsset, setAssetTypeClass } from './FileAsset';

declare global
{
    export interface MixinsAssetTypeClassMap
    {
        'folder': new () => FolderAsset;
    }
}

/**
 * 文件夹资源
 */
@ov({ component: 'OVFolderAsset' })
export class FolderAsset extends FileAsset
{
    static extenson = '';

    assetType = AssetType.folder;

    /**
     * 子资源列表
     */
    get childrenAssets()
    {
        const children = this.rs.getChildrenAssetByPath(this.assetPath);

        return children;
    }

    initAsset()
    {
    }

    /**
     * 删除资源
     *
     * @param callback 完成回调
     */
    delete(callback?: (err: Error) => void)
    {
        super.delete(callback);
    }

    /**
     * 保存文件
     * @param callback 完成回调
     */
    saveFile(callback?: (err: Error) => void)
    {
        this.rs.fs.mkdir(this.assetPath, callback);
    }

    /**
     * 读取文件
     * @param callback 完成回调
     */
    readFile(callback?: (err: Error) => void)
    {
        callback && callback(null);
    }
}

setAssetTypeClass('folder', FolderAsset);
