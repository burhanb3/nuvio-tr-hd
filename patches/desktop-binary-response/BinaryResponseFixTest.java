import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import com.nuviotrhd.compat.BinaryResponseFix;
import okhttp3.MediaType;
import okhttp3.ResponseBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;

public final class BinaryResponseFixTest {
    public static void main(String[] args) throws Exception {
        byte[] binary = new byte[131072];
        for (int index = 0; index < binary.length; index++) binary[index] = (byte) index;
        var actual = BinaryResponseFix.readBody(
                ResponseBody.create(MediaType.get("video/mp4"), binary), binary.length);
        require(Arrays.equals(binary, actual.bytes), "Binary bytes changed");
        require(!actual.text.endsWith("...[truncated]"), "Exact length marked truncated");

        String subtitle = "Türkçe şğıİöçü";
        byte[] text = subtitle.getBytes(StandardCharsets.UTF_8);
        var utf8 = BinaryResponseFix.readBody(
                ResponseBody.create(MediaType.get("text/vtt; charset=utf-8"), text), 1024);
        require(utf8.text.equals(subtitle), "UTF-8 subtitle changed");
        require(Arrays.equals(text, utf8.bytes), "Text byte view changed");

        var limited = BinaryResponseFix.readBody(
                ResponseBody.create(MediaType.get("video/mp4"), binary), 17);
        require(limited.bytes.length == 17, "Response cap changed");
        require(limited.text.endsWith("\n...[truncated]"), "Truncation marker missing");
        require(BinaryResponseFix.readBody(null, 1024).bytes.length == 0, "Empty body failed");
        var call = new OkHttpClient().newCall(new Request.Builder().url("https://example.test").build());
        require(BinaryResponseFix.boundedCall(call) == call, "Call replaced");
        require(call.timeout().timeoutNanos() == 10_000_000_000L, "Native deadline missing");
        System.out.println("Binary bytes, UTF-8, truncation, empty body and native call limit passed");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
}
