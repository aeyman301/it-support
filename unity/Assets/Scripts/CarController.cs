using UnityEngine;

// Physics-based car driving via four WheelColliders. Placeholder tuning
// values below are a reasonable starting point, not a finished feel -
// adjust in the Inspector once this is running in the Editor.
[RequireComponent(typeof(Rigidbody))]
public class CarController : MonoBehaviour
{
    public WheelCollider wheelColliderFL;
    public WheelCollider wheelColliderFR;
    public WheelCollider wheelColliderRL;
    public WheelCollider wheelColliderRR;

    public DriveInput input;

    public float maxMotorTorque = 1800f;
    public float maxSteerAngle = 32f;
    public float brakeTorque = 4000f;

    private Rigidbody rb;

    public float SpeedKmh => rb != null ? rb.linearVelocity.magnitude * 3.6f : 0f;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        rb.centerOfMass = new Vector3(0f, -0.5f, 0f);
    }

    private void FixedUpdate()
    {
        if (input == null) return;

        float steer = input.Steer * maxSteerAngle;
        wheelColliderFL.steerAngle = steer;
        wheelColliderFR.steerAngle = steer;

        float motor = input.Throttle * maxMotorTorque;
        wheelColliderRL.motorTorque = motor;
        wheelColliderRR.motorTorque = motor;
        wheelColliderFL.motorTorque = motor * 0.5f;
        wheelColliderFR.motorTorque = motor * 0.5f;

        float brake = input.Brake * brakeTorque;
        wheelColliderFL.brakeTorque = brake;
        wheelColliderFR.brakeTorque = brake;
        wheelColliderRL.brakeTorque = brake;
        wheelColliderRR.brakeTorque = brake;
    }
}
