using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

// Reads keyboard input (for testing in the Editor) and on-screen touch
// buttons (for mobile) and combines them into a single Steer/Throttle/Brake
// signal that CarController consumes.
public class DriveInput : MonoBehaviour
{
    public float Steer { get; private set; }
    public float Throttle { get; private set; }
    public float Brake { get; private set; }

    private bool touchLeft;
    private bool touchRight;
    private bool touchAccelerate;
    private bool touchBrake;

    private void Update()
    {
        float keyboardSteer = Input.GetAxis("Horizontal");
        float keyboardVertical = Input.GetAxis("Vertical");
        float keyboardThrottle = Mathf.Clamp01(keyboardVertical);
        float keyboardBrake = Mathf.Clamp01(-keyboardVertical);

        float touchSteer = (touchRight ? 1f : 0f) - (touchLeft ? 1f : 0f);

        Steer = Mathf.Clamp(keyboardSteer + touchSteer, -1f, 1f);
        Throttle = Mathf.Clamp01(keyboardThrottle + (touchAccelerate ? 1f : 0f));
        Brake = Mathf.Clamp01(keyboardBrake + (touchBrake ? 1f : 0f));
    }

    public void BuildTouchControls(Canvas canvas)
    {
        CreateButton(canvas, "SteerLeft", new Vector2(-380, 140), "◀",
            () => touchLeft = true, () => touchLeft = false);
        CreateButton(canvas, "SteerRight", new Vector2(-260, 140), "▶",
            () => touchRight = true, () => touchRight = false);
        CreateButton(canvas, "Brake", new Vector2(260, 140), "BRK",
            () => touchBrake = true, () => touchBrake = false);
        CreateButton(canvas, "Accelerate", new Vector2(380, 140), "GAS",
            () => touchAccelerate = true, () => touchAccelerate = false);
    }

    private void CreateButton(Canvas canvas, string name, Vector2 anchoredPosition, string label, System.Action onDown, System.Action onUp)
    {
        var buttonGO = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(EventTrigger));
        buttonGO.transform.SetParent(canvas.transform, false);

        var rect = buttonGO.GetComponent<RectTransform>();
        rect.anchorMin = new Vector2(0.5f, 0f);
        rect.anchorMax = new Vector2(0.5f, 0f);
        rect.pivot = new Vector2(0.5f, 0f);
        rect.sizeDelta = new Vector2(96, 96);
        rect.anchoredPosition = anchoredPosition;

        var image = buttonGO.GetComponent<Image>();
        image.color = new Color(1f, 1f, 1f, 0.35f);

        var textGO = new GameObject("Label", typeof(RectTransform), typeof(Text));
        textGO.transform.SetParent(buttonGO.transform, false);
        var textRect = textGO.GetComponent<RectTransform>();
        textRect.anchorMin = Vector2.zero;
        textRect.anchorMax = Vector2.one;
        textRect.offsetMin = Vector2.zero;
        textRect.offsetMax = Vector2.zero;

        var text = textGO.GetComponent<Text>();
        text.text = label;
        text.alignment = TextAnchor.MiddleCenter;
        text.color = Color.white;
        text.fontSize = 26;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

        var trigger = buttonGO.GetComponent<EventTrigger>();

        var down = new EventTrigger.Entry { eventID = EventTriggerType.PointerDown };
        down.callback.AddListener(_ => onDown());
        trigger.triggers.Add(down);

        var up = new EventTrigger.Entry { eventID = EventTriggerType.PointerUp };
        up.callback.AddListener(_ => onUp());
        trigger.triggers.Add(up);

        var exit = new EventTrigger.Entry { eventID = EventTriggerType.PointerExit };
        exit.callback.AddListener(_ => onUp());
        trigger.triggers.Add(exit);
    }
}
