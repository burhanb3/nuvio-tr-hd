package com.nuviotrhd.compat;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import okhttp3.Call;
import okhttp3.ResponseBody;

/** Preserves the bounded HTTP bytes before decoding the optional text view. */
public final class BinaryResponseFix {
    private BinaryResponseFix() {}

    public static Call boundedCall(Call call) {
        // Includes DNS/address retries and body reads in one native deadline.
        call.timeout().timeout(10, TimeUnit.SECONDS);
        return call;
    }

    public static final class BodyRead {
        public final byte[] bytes;
        public final String text;

        private BodyRead(byte[] bytes, String text) {
            this.bytes = bytes;
            this.text = text;
        }
    }

    public static BodyRead readBody(ResponseBody body, int maxBytes) throws Exception {
        if (body == null) return new BodyRead(new byte[0], "");
        Charset charset = body.contentType() == null
                ? StandardCharsets.UTF_8
                : body.contentType().charset(StandardCharsets.UTF_8);
        byte[] bytes;
        boolean truncated;
        try (InputStream stream = body.byteStream()) {
            bytes = stream.readNBytes(Math.max(0, maxBytes));
            truncated = stream.read() != -1;
        }
        String text = new String(bytes, charset);
        if (truncated) text += "\n...[truncated]";
        return new BodyRead(bytes, text);
    }
}
