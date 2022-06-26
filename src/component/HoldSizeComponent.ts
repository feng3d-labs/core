/* eslint-disable @typescript-eslint/ban-ts-comment */
import { oav } from '@feng3d/objectview';
import { watch } from '@feng3d/watcher';
import { Camera } from '../cameras/Camera';
import { RegisterComponent } from '../ecs/Component';
import { AddComponentMenu } from '../Menu';
import { Component3D } from './Component3D';

declare global
{
    interface MixinsComponentMap { HoldSizeComponent: HoldSizeComponent; }
}

@AddComponentMenu('Layout/HoldSizeComponent')
@RegisterComponent({ name: 'HoldSizeComponent' })
export class HoldSizeComponent extends Component3D
{
    __class__: 'feng3d.HoldSizeComponent';

    /**
     * 保持缩放尺寸
     */
    @oav()
    @watch('_invalidateSceneTransform')
    holdSize = 1;

    /**
     * 相机
     */
    @oav()
    @watch('_onCameraChanged')
    camera: Camera;

    init()
    {
        this.node3d.on('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
    }

    dispose()
    {
        this.camera = null;
        this.node3d.off('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
        super.dispose();
    }

    private _onCameraChanged(property: string, oldValue: Camera, value: Camera)
    {
        if (oldValue) oldValue.off('scenetransformChanged', this._invalidateSceneTransform, this);
        if (value) value.on('scenetransformChanged', this._invalidateSceneTransform, this);
        this._invalidateSceneTransform();
    }

    private _invalidateSceneTransform()
    {
        // @ts-ignore
        if (this._gameObject) this.node3d._invalidateSceneTransform();
    }

    private _onUpdateLocalToWorldMatrix()
    {
        // @ts-ignore
        const _localToWorldMatrix = this.node3d._localToWorldMatrix;
        if (this.holdSize && this.camera && _localToWorldMatrix)
        {
            const depthScale = this._getDepthScale(this.camera);
            const vec = _localToWorldMatrix.toTRS();
            vec[2].scaleNumber(depthScale * this.holdSize);
            _localToWorldMatrix.fromTRS(vec[0], vec[1], vec[2]);

            console.assert(!isNaN(_localToWorldMatrix.elements[0]));
        }
    }

    private _getDepthScale(camera: Camera)
    {
        const cameraTranform = camera.node3d.localToWorldMatrix;
        const distance = this.node3d.worldPosition.subTo(cameraTranform.getPosition());
        if (distance.length === 0)
        { distance.x = 1; }
        const depth = distance.dot(cameraTranform.getAxisZ());
        let scale = camera.getScaleByDepth(depth);
        // 限制在放大缩小100倍之间，否则容易出现矩阵不可逆问题
        scale = Math.max(Math.min(100, scale), 0.01);

        return scale;
    }
}
