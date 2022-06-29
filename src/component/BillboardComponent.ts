/* eslint-disable @typescript-eslint/ban-ts-comment */
import { oav } from '@feng3d/objectview';
import { watch } from '@feng3d/watcher';
import { Camera } from '../cameras/Camera';
import { Component, RegisterComponent } from '../ecs/Component';
import { AddComponentMenu } from '../Menu';

declare global
{
    interface MixinsComponentMap { BillboardComponent: BillboardComponent; }
}

@AddComponentMenu('Layout/BillboardComponent')
@RegisterComponent({ name: 'BillboardComponent' })
export class BillboardComponent extends Component
{
    __class__: 'feng3d.BillboardComponent';

    /**
     * 相机
     */
    @oav()
    @watch('_onCameraChanged')
    camera: Camera;

    init()
    {
        super.init();
        this.transform.on('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
        this._invalidHoldSizeMatrix();
    }

    private _onCameraChanged(property: string, oldValue: Camera, value: Camera)
    {
        if (oldValue) oldValue.off('scenetransformChanged', this._invalidHoldSizeMatrix, this);
        if (value) value.on('scenetransformChanged', this._invalidHoldSizeMatrix, this);
        this._invalidHoldSizeMatrix();
    }

    private _invalidHoldSizeMatrix()
    {
        // @ts-ignore
        if (this._gameObject) this.transform._invalidateSceneTransform();
    }

    private _onUpdateLocalToWorldMatrix()
    {
        // @ts-ignore
        const _localToWorldMatrix = this.transform._localToWorldMatrix;
        if (_localToWorldMatrix && this.camera)
        {
            const camera = this.camera;
            const cameraPos = camera.transform.worldPosition;
            const yAxis = camera.transform.localToWorldMatrix.getAxisY();
            _localToWorldMatrix.lookAt(cameraPos, yAxis);
        }
    }

    destroy()
    {
        this.camera = null;
        this.transform.off('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
        super.destroy();
    }
}
