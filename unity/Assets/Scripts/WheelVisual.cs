using UnityEngine;

// Keeps a visible wheel mesh in sync with its (invisible) physics WheelCollider.
public class WheelVisual : MonoBehaviour
{
    public WheelCollider wheelCollider;
    public Transform visual;

    private void LateUpdate()
    {
        if (wheelCollider == null || visual == null) return;

        wheelCollider.GetWorldPose(out Vector3 position, out Quaternion rotation);
        visual.position = position;
        visual.rotation = rotation;
    }
}
