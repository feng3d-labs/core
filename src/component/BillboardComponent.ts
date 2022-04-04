import { Camera } from '../cameras/Camera';
import { AddComponentMenu } from '../Menu';
import { oav } from '@feng3d/objectview';
import { watch } from '@feng3d/watcher';
import { RegisterComponent } from './Component';
import { Component3D } from './Component3D';

declare global
{
    interface MixinsComponentMap { BillboardComponent: BillboardComponent; }
}

@AddComponentMenu('Layout/BillboardComponent')
@RegisterComponent({ name: 'BillboardComponent' })
export class BillboardComponent extends Component3D
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
        this.node3d.on('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
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
        if (this._entity) this.node3d._invalidateSceneTransform();
    }

    private _onUpdateLocalToWorldMatrix()
    {
        const _localToWorldMatrix = this.node3d._localToWorldMatrix;
        if (_localToWorldMatrix && this.camera)
        {
            const camera = this.camera;
            const cameraPos = camera.node3d.worldPosition;
            const yAxis = camera.node3d.localToWorldMatrix.getAxisY();
            _localToWorldMatrix.lookAt(cameraPos, yAxis);
        }
    }

    dispose()
    {
        this.camera = null;
        this.node3d.off('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
        super.dispose();
    }
}
