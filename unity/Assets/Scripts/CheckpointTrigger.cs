using UnityEngine;

// One trigger volume placed along the track by TrackBuilder. Index 0 is the
// start/finish line; the rest just have to be crossed in order for a lap to
// count.
[RequireComponent(typeof(BoxCollider))]
public class CheckpointTrigger : MonoBehaviour
{
    public int index;

    private void OnTriggerEnter(Collider other)
    {
        if (other.attachedRigidbody == null) return;
        if (!other.attachedRigidbody.CompareTag("Player")) return;

        if (RaceManager.Instance != null)
        {
            RaceManager.Instance.NotifyCheckpoint(index, transform.position, transform.rotation);
        }
    }
}
