namespace feng3d
{
    export interface MixinsGlobalEvents
    {
        /**
         * shader资源发生变化
         */
        'asset.shaderChanged': any;

        /**
         * 脚本发生变化
         */
        'asset.scriptChanged': any;
    }
}