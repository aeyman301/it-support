using System.Collections.Generic;
using UnityEngine;

// Procedurally builds a simple stadium-shaped oval track (two straights
// joined by two semicircular curves) entirely out of primitive cubes/planes,
// with checkpoint triggers spaced along it. No imported 3D assets - this is
// placeholder geometry meant to be replaced with real art later.
public static class TrackBuilder
{
    public struct Result
    {
        public Vector3 spawnPosition;
        public Quaternion spawnRotation;
        public int checkpointCount;
    }

    private const float TrackWidth = 10f;
    private const float WallHeight = 1.2f;
    private const float StraightLength = 40f;
    private const float CurveRadius = 18f;
    private const int StraightSegments = 6;
    private const int CurveSegments = 16;
    private const int CheckpointEvery = 4;

    public static Result Build()
    {
        var trackRoot = new GameObject("Track");

        Material roadMaterial = MakeMaterial(new Color(0.15f, 0.15f, 0.17f));
        Material wallMaterial = MakeMaterial(new Color(0.9f, 0.35f, 0.1f));
        Material grassMaterial = MakeMaterial(new Color(0.18f, 0.5f, 0.2f));

        // Large ground plane so the car always has something under it, even
        // if it drives off the track.
        var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Ground";
        ground.transform.SetParent(trackRoot.transform);
        ground.transform.position = new Vector3(0f, -0.05f, 0f);
        ground.transform.localScale = new Vector3(40f, 1f, 40f);
        ground.GetComponent<Renderer>().sharedMaterial = grassMaterial;

        List<Vector3> centerline = BuildStadiumCenterline(StraightLength, CurveRadius, StraightSegments, CurveSegments);
        int checkpointCount = 0;

        for (int i = 0; i < centerline.Count; i++)
        {
            Vector3 current = centerline[i];
            Vector3 next = centerline[(i + 1) % centerline.Count];
            Vector3 forward = (next - current).normalized;
            Vector3 mid = (current + next) * 0.5f;
            float segmentLength = Vector3.Distance(current, next);
            Quaternion segmentRotation = Quaternion.LookRotation(forward, Vector3.up);

            var tile = GameObject.CreatePrimitive(PrimitiveType.Cube);
            tile.name = "RoadTile_" + i;
            tile.transform.SetParent(trackRoot.transform);
            tile.transform.position = mid + Vector3.up * 0.05f;
            tile.transform.rotation = segmentRotation;
            tile.transform.localScale = new Vector3(TrackWidth, 0.1f, segmentLength * 1.05f);
            tile.GetComponent<Renderer>().sharedMaterial = roadMaterial;

            Vector3 right = Vector3.Cross(Vector3.up, forward).normalized;
            CreateWallSegment(trackRoot.transform, mid + right * (TrackWidth * 0.5f), segmentRotation, segmentLength, wallMaterial, "WallRight_" + i);
            CreateWallSegment(trackRoot.transform, mid - right * (TrackWidth * 0.5f), segmentRotation, segmentLength, wallMaterial, "WallLeft_" + i);

            if (i % CheckpointEvery == 0)
            {
                CreateCheckpoint(trackRoot.transform, current, segmentRotation, checkpointCount);
                checkpointCount++;
            }
        }

        Vector3 startForward = (centerline[1] - centerline[0]).normalized;
        var result = new Result
        {
            spawnPosition = centerline[0] + Vector3.up * 0.6f,
            spawnRotation = Quaternion.LookRotation(startForward, Vector3.up),
            checkpointCount = checkpointCount,
        };
        return result;
    }

    private static void CreateWallSegment(Transform parent, Vector3 position, Quaternion rotation, float length, Material material, string name)
    {
        var wall = GameObject.CreatePrimitive(PrimitiveType.Cube);
        wall.name = name;
        wall.transform.SetParent(parent);
        wall.transform.position = position + Vector3.up * (WallHeight * 0.5f);
        wall.transform.rotation = rotation;
        wall.transform.localScale = new Vector3(0.4f, WallHeight, length * 1.05f);
        wall.GetComponent<Renderer>().sharedMaterial = material;
    }

    private static void CreateCheckpoint(Transform parent, Vector3 position, Quaternion rotation, int index)
    {
        var checkpointGO = new GameObject("Checkpoint_" + index);
        checkpointGO.transform.SetParent(parent);
        checkpointGO.transform.position = position;
        checkpointGO.transform.rotation = rotation;

        var box = checkpointGO.AddComponent<BoxCollider>();
        box.isTrigger = true;
        box.size = new Vector3(TrackWidth, 4f, 1.5f);

        var trigger = checkpointGO.AddComponent<CheckpointTrigger>();
        trigger.index = index;
    }

    // Centerline points for a stadium/oval shape: bottom straight -> right
    // semicircle -> top straight -> left semicircle, forming a closed loop.
    private static List<Vector3> BuildStadiumCenterline(float straightLength, float radius, int straightSegments, int curveSegments)
    {
        var points = new List<Vector3>();
        float half = straightLength * 0.5f;
        Vector3 rightCenter = new Vector3(half, 0f, 0f);
        Vector3 leftCenter = new Vector3(-half, 0f, 0f);

        for (int i = 0; i < straightSegments; i++)
        {
            float t = (float)i / straightSegments;
            points.Add(new Vector3(Mathf.Lerp(-half, half, t), 0f, -radius));
        }

        for (int i = 0; i < curveSegments; i++)
        {
            float theta = Mathf.Lerp(0f, 180f, (float)i / curveSegments) * Mathf.Deg2Rad;
            points.Add(rightCenter + radius * new Vector3(Mathf.Sin(theta), 0f, -Mathf.Cos(theta)));
        }

        for (int i = 0; i < straightSegments; i++)
        {
            float t = (float)i / straightSegments;
            points.Add(new Vector3(Mathf.Lerp(half, -half, t), 0f, radius));
        }

        for (int i = 0; i < curveSegments; i++)
        {
            float theta = Mathf.Lerp(0f, 180f, (float)i / curveSegments) * Mathf.Deg2Rad;
            points.Add(leftCenter + radius * new Vector3(-Mathf.Sin(theta), 0f, Mathf.Cos(theta)));
        }

        return points;
    }

    private static Material MakeMaterial(Color color)
    {
        var material = new Material(Shader.Find("Standard"));
        material.color = color;
        return material;
    }
}
