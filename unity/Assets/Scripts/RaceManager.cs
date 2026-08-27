using UnityEngine;

// Lap counting, timing, a short start countdown, and a fallback respawn if
// the car falls off the track. Checkpoint 0 is the start/finish line;
// checkpoints must be crossed in order for a lap to be counted.
public class RaceManager : MonoBehaviour
{
    public static RaceManager Instance { get; private set; }

    public int checkpointCount;
    public Transform car;
    public int totalLaps = 3;

    public int CurrentLap { get; private set; } = 1;
    public int TotalLaps => totalLaps;
    public float CurrentLapTime { get; private set; }
    public float BestLapTime { get; private set; } = float.MaxValue;
    public string Message { get; private set; } = "";

    private int nextCheckpoint = 1;
    private float lapStartTime;
    private bool countingDown = true;
    private float countdown = 3f;
    private bool raceFinished;

    private Vector3 lastCheckpointPosition;
    private Quaternion lastCheckpointRotation;

    private Rigidbody carRigidbody;
    private CarController carController;

    private void Awake()
    {
        Instance = this;
    }

    private void Start()
    {
        if (car != null)
        {
            carRigidbody = car.GetComponent<Rigidbody>();
            carController = car.GetComponent<CarController>();
            lastCheckpointPosition = car.position;
            lastCheckpointRotation = car.rotation;
        }

        SetCarControlEnabled(false);
        lapStartTime = Time.time;
    }

    private void Update()
    {
        if (countingDown)
        {
            countdown -= Time.deltaTime;
            Message = countdown > 0 ? Mathf.CeilToInt(countdown).ToString() : "GO!";

            if (countdown <= -0.5f)
            {
                countingDown = false;
                Message = "";
                SetCarControlEnabled(true);
                lapStartTime = Time.time;
            }
            return;
        }

        if (raceFinished) return;

        CurrentLapTime = Time.time - lapStartTime;

        if (car != null && car.position.y < -20f)
        {
            RespawnAtLastCheckpoint();
        }
    }

    private void SetCarControlEnabled(bool isEnabled)
    {
        if (carController != null) carController.enabled = isEnabled;
        if (carRigidbody != null)
        {
            carRigidbody.linearVelocity = Vector3.zero;
            carRigidbody.angularVelocity = Vector3.zero;
        }
    }

    public void NotifyCheckpoint(int index, Vector3 position, Quaternion rotation)
    {
        if (raceFinished || countingDown) return;

        if (index != 0)
        {
            if (index == nextCheckpoint)
            {
                nextCheckpoint++;
                lastCheckpointPosition = position;
                lastCheckpointRotation = rotation;
            }
            return;
        }

        // index == 0 is the start/finish line.
        if (nextCheckpoint >= checkpointCount)
        {
            float lapTime = Time.time - lapStartTime;
            if (lapTime < BestLapTime) BestLapTime = lapTime;

            if (CurrentLap >= totalLaps)
            {
                raceFinished = true;
                Message = "Finished! Best lap " + BestLapTime.ToString("F2") + "s";
                SetCarControlEnabled(false);
                return;
            }

            CurrentLap++;
            nextCheckpoint = 1;
            lapStartTime = Time.time;
        }

        lastCheckpointPosition = position;
        lastCheckpointRotation = rotation;
    }

    private void RespawnAtLastCheckpoint()
    {
        if (carRigidbody == null || car == null) return;

        car.position = lastCheckpointPosition + Vector3.up * 1f;
        car.rotation = lastCheckpointRotation;
        carRigidbody.linearVelocity = Vector3.zero;
        carRigidbody.angularVelocity = Vector3.zero;
    }
}
