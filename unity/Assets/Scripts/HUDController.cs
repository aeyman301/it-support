using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

// Builds a simple on-screen HUD (speed, lap, timer, countdown message) plus
// the on-screen touch controls, entirely at runtime - no prebuilt UI assets
// required.
public class HUDController : MonoBehaviour
{
    public RaceManager raceManager;
    public CarController carController;
    public DriveInput input;

    private Text speedText;
    private Text lapText;
    private Text timeText;
    private Text messageText;

    private void Start()
    {
        if (FindFirstObjectByType<EventSystem>() == null)
        {
            new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
        }

        var canvasGO = new GameObject("HUD Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        var canvas = canvasGO.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;

        var scaler = canvasGO.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280, 720);

        speedText = CreateText(canvas.transform, "SpeedText", new Vector2(0.02f, 0.88f), new Vector2(0.3f, 0.98f), TextAnchor.UpperLeft, 32);
        lapText = CreateText(canvas.transform, "LapText", new Vector2(0.7f, 0.9f), new Vector2(0.98f, 0.98f), TextAnchor.UpperRight, 28);
        timeText = CreateText(canvas.transform, "TimeText", new Vector2(0.6f, 0.82f), new Vector2(0.98f, 0.9f), TextAnchor.UpperRight, 22);
        messageText = CreateText(canvas.transform, "MessageText", new Vector2(0.2f, 0.45f), new Vector2(0.8f, 0.6f), TextAnchor.MiddleCenter, 48);

        if (input != null)
        {
            input.BuildTouchControls(canvas);
        }
    }

    private Text CreateText(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax, TextAnchor alignment, int fontSize)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Text));
        go.transform.SetParent(parent, false);

        var rect = go.GetComponent<RectTransform>();
        rect.anchorMin = anchorMin;
        rect.anchorMax = anchorMax;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;

        var text = go.GetComponent<Text>();
        text.alignment = alignment;
        text.color = Color.white;
        text.fontSize = fontSize;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        return text;
    }

    private void Update()
    {
        if (carController != null && speedText != null)
        {
            speedText.text = Mathf.RoundToInt(carController.SpeedKmh) + " km/h";
        }

        if (raceManager != null)
        {
            lapText.text = "Lap " + raceManager.CurrentLap + " / " + raceManager.TotalLaps;
            string best = raceManager.BestLapTime < float.MaxValue ? raceManager.BestLapTime.ToString("F2") + "s" : "--";
            timeText.text = raceManager.CurrentLapTime.ToString("F2") + "s   Best: " + best;
            messageText.text = raceManager.Message;
        }
    }
}
