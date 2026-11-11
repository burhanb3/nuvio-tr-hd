import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.jar.JarEntry;
import java.util.jar.JarInputStream;
import java.util.jar.JarOutputStream;
import jdk.internal.org.objectweb.asm.ClassReader;
import jdk.internal.org.objectweb.asm.ClassWriter;
import jdk.internal.org.objectweb.asm.Opcodes;
import jdk.internal.org.objectweb.asm.tree.AbstractInsnNode;
import jdk.internal.org.objectweb.asm.tree.ClassNode;
import jdk.internal.org.objectweb.asm.tree.FieldInsnNode;
import jdk.internal.org.objectweb.asm.tree.InsnList;
import jdk.internal.org.objectweb.asm.tree.InsnNode;
import jdk.internal.org.objectweb.asm.tree.MethodInsnNode;
import jdk.internal.org.objectweb.asm.tree.MethodNode;
import jdk.internal.org.objectweb.asm.tree.VarInsnNode;

/** Builds a patched copy of the exact Nuvio Desktop 1.1.35 JAR. */
public final class PatchDesktopJar {
    private static final String EXPECTED_SHA =
            "c96931a3aac6572b45db5655738cfbd325cd718cf8438cfd20fe53e1787e7933";
    private static final String TARGET =
            "com/nuvio/app/features/addons/AddonPlatform_desktopKt$httpRequestRaw$2.class";
    private static final String FIX = "com/nuviotrhd/compat/BinaryResponseFix";
    private static final String READ = FIX + "$BodyRead";
    private static final String RESPONSE = "com/nuvio/app/features/addons/RawHttpResponse";
    private static final String DEFAULT_CTOR =
            "(ILjava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/util/Map;[BILkotlin/jvm/internal/DefaultConstructorMarker;)V";

    public static void main(String[] args) throws Exception {
        Path source = Path.of(args[0]);
        Path output = Path.of(args[1]);
        Path classes = Path.of(args[2]);
        byte[] original = Files.readAllBytes(source);
        String digest = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(original));
        if (!digest.equals(EXPECTED_SHA)) throw new IllegalArgumentException("Unexpected application JAR");
        if (Files.exists(output)) throw new IllegalArgumentException("Output already exists");
        int patched = 0;
        try (JarInputStream input = new JarInputStream(Files.newInputStream(source));
             JarOutputStream jar = new JarOutputStream(Files.newOutputStream(output), input.getManifest())) {
            JarEntry entry;
            while ((entry = input.getNextJarEntry()) != null) {
                byte[] bytes = input.readAllBytes();
                if (entry.getName().equals(TARGET)) {
                    bytes = patch(bytes);
                    patched++;
                }
                jar.putNextEntry(new JarEntry(entry.getName()));
                jar.write(bytes);
                jar.closeEntry();
            }
            for (String name : new String[] {FIX, READ}) {
                jar.putNextEntry(new JarEntry(name + ".class"));
                jar.write(Files.readAllBytes(classes.resolve(name + ".class")));
                jar.closeEntry();
            }
        }
        if (patched != 1) throw new IllegalStateException("Expected exactly one HTTP response class");
        System.out.println("Patched bounded binary HTTP response handling");
    }

    private static byte[] patch(byte[] bytes) {
        ClassNode type = new ClassNode();
        new ClassReader(bytes).accept(type, 0);
        int bodyReads = 0;
        int constructors = 0;
        int boundedCalls = 0;
        for (MethodNode method : type.methods) {
            if (!method.name.equals("invokeSuspend")) continue;
            int bodyLocal = method.maxLocals++;
            for (AbstractInsnNode instruction : method.instructions.toArray()) {
                if (!(instruction instanceof MethodInsnNode call)) continue;
                if (call.owner.equals("okhttp3/OkHttpClient") && call.name.equals("newCall")
                        && call.desc.equals("(Lokhttp3/Request;)Lokhttp3/Call;")) {
                    method.instructions.insert(call, new MethodInsnNode(Opcodes.INVOKESTATIC,
                            FIX, "boundedCall", "(Lokhttp3/Call;)Lokhttp3/Call;", false));
                    boundedCalls++;
                }
                if (call.name.equals("access$readResponseBodyLimited")) {
                    call.owner = FIX;
                    call.name = "readBody";
                    call.desc = "(Lokhttp3/ResponseBody;I)L" + READ + ";";
                    InsnList save = new InsnList();
                    save.add(new InsnNode(Opcodes.DUP));
                    save.add(new VarInsnNode(Opcodes.ASTORE, bodyLocal));
                    save.add(new FieldInsnNode(Opcodes.GETFIELD, READ, "text", "Ljava/lang/String;"));
                    method.instructions.insert(call, save);
                    bodyReads++;
                }
                if (call.owner.equals(RESPONSE) && call.name.equals("<init>") && call.desc.equals(DEFAULT_CTOR)) {
                    InsnList exactBytes = new InsnList();
                    // Replace the default byte-array argument and its Kotlin mask.
                    exactBytes.add(new InsnNode(Opcodes.POP));
                    exactBytes.add(new InsnNode(Opcodes.POP));
                    exactBytes.add(new InsnNode(Opcodes.POP));
                    exactBytes.add(new VarInsnNode(Opcodes.ALOAD, bodyLocal));
                    exactBytes.add(new FieldInsnNode(Opcodes.GETFIELD, READ, "bytes", "[B"));
                    method.instructions.insertBefore(call, exactBytes);
                    call.desc = "(ILjava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/util/Map;[B)V";
                    constructors++;
                }
            }
        }
        if (bodyReads != 1 || constructors != 1 || boundedCalls != 1) {
            throw new IllegalStateException("Unexpected HTTP bytecode");
        }
        ClassWriter writer = new ClassWriter(ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS);
        type.accept(writer);
        return writer.toByteArray();
    }
}
