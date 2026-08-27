using UnityEngine;

// Entry point: attach this to a single empty GameObject in any scene and it
// builds the entire game at runtime - camera, lighting, track, car, HUD.
// This keeps the whole game in reviewable/versioned code instead of a
// hand-authored .unity scene file.
public class GameBootstrap : MonoBehaviour
{
    private void Start()
    {
        EnsureCamera();
        EnsureLight();

        TrackBuilder.Result track = TrackBuilder.Build();
        GameObject car = BuildCar(track.spawnPosition, track.spawnRotation);

        var cameraFollow = Camera.main.gameObject.AddComponent<CameraFollow>();
        cameraFollow.target = car.transform;

        var raceManager = gameObject.AddComponent<RaceManager>();
        raceManager.checkpointCount = track.checkpointCount;
        raceManager.car = car.transform;

        var hud = gameObject.AddComponent<HUDController>();
        hud.raceManager = raceManager;
        hud.carController = car.GetComponent<CarController>();
        hud.input = car.GetComponent<DriveInput>();
    }

    private void EnsureCamera()
    {
        if (Camera.main != null) return;

        var cameraGO = new GameObject("Main Camera");
        cameraGO.tag = "MainCamera";
        cameraGO.AddComponent<Camera>();
        cameraGO.AddComponent<AudioListener>();
    }

    private void EnsureLight()
    {
        if (FindFirstObjectByType<Light>() != null) return;

        var lightGO = new GameObject("Directional Light");
        var light = lightGO.AddComponent<Light>();
        light.type = LightType.Directional;
        light.intensity = 1f;
        lightGO.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
    }

    private GameObject BuildCar(Vector3 position, Quaternion rotation)
    {
        var carRoot = new GameObject("Car");
        carRoot.transform.position = position;
        carRoot.transform.rotation = rotation;
        carRoot.tag = "Player";

        var rb = carRoot.AddComponent<Rigidbody>();
        rb.mass = 1200f;

        var bodyMaterial = new Material(Shader.Find("Standard")) { color = new Color(0.1f, 0.4f, 0.9f) };
        var wheelMaterial = new Material(Shader.Find("Standard")) { color = new Color(0.05f, 0.05f, 0.05f) };

        var body = GameObject.CreatePrimitive(PrimitiveType.Cube);
        body.name = "Body";
        body.transform.SetParent(carRoot.transform, false);
        body.transform.localPosition = new Vector3(0f, 0.5f, 0f);
        body.transform.localScale = new Vector3(1.8f, 0.8f, 3.6f);
        body.GetComponent<Renderer>().sharedMaterial = bodyMaterial;
        Object.Destroy(body.GetComponent<Collider>());

        var bodyCollider = carRoot.AddComponent<BoxCollider>();
        bodyCollider.center = new Vector3(0f, 0.5f, 0f);
        bodyCollider.size = new Vector3(1.8f, 0.8f, 3.6f);

        Vector3[] wheelOffsets =
        {
            new Vector3(-0.9f, 0.35f, 1.2f),  // front left
            new Vector3(0.9f, 0.35f, 1.2f),   // front right
            new Vector3(-0.9f, 0.35f, -1.2f), // rear left
            new Vector3(0.9f, 0.35f, -1.2f),  // rear right
        };

        var colliders = new WheelCollider[4];
        for (int i = 0; i < wheelOffsets.Length; i++)
        {
            var colliderGO = new GameObject("WheelCollider_" + i);
            colliderGO.transform.SetParent(carRoot.transform, false);
            colliderGO.transform.localPosition = wheelOffsets[i];

            var wheelCollider = colliderGO.AddComponent<WheelCollider>();
            wheelCollider.radius = 0.35f;
            wheelCollider.suspensionDistance = 0.4f;
            JointSpring suspension = wheelCollider.suspensionSpring;
            suspension.spring = 35000f;
            suspension.damper = 4500f;
            wheelCollider.suspensionSpring = suspension;
            colliders[i] = wheelCollider;

            var visual = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            visual.name = "WheelVisual_" + i;
            Object.Destroy(visual.GetComponent<Collider>());
            visual.transform.SetParent(carRoot.transform, false);
            visual.transform.localScale = new Vector3(0.35f, 0.18f, 0.35f);
            visual.transform.Rotate(0f, 0f, 90f);
            visual.GetComponent<Renderer>().sharedMaterial = wheelMaterial;

            var wheelVisual = colliderGO.AddComponent<WheelVisual>();
            wheelVisual.wheelCollider = wheelCollider;
            wheelVisual.visual = visual.transform;
        }

        var input = carRoot.AddComponent<DriveInput>();

        var controller = carRoot.AddComponent<CarController>();
        controller.wheelColliderFL = colliders[0];
        controller.wheelColliderFR = colliders[1];
        controller.wheelColliderRL = colliders[2];
        controller.wheelColliderRR = colliders[3];
        controller.input = input;

        return carRoot;
    }
}
