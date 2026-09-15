// Servidor local de Vila Mediterrània, sense dependències.
// Es compila amb el compilador inclòs a Windows (.NET Framework 4):
//   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /optimize /out:Inicia-Vila.exe servidor.cs
// En executar-lo, serveix la carpeta on és l'executable i obre el navegador.
// Com el servidor Node (local-server.mjs), detecta els àudios de la carpeta
// music i genera /music/playlist.json; els fitxers es transmeten per fragments
// (peticions de rang) sense carregar-los sencers a la memòria.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

static class Servidor
{
    static string root;
    static readonly Dictionary<string, string> types = new Dictionary<string, string>
    {
        {".html", "text/html; charset=utf-8"},
        {".css", "text/css; charset=utf-8"},
        {".js", "text/javascript; charset=utf-8"},
        {".json", "application/json; charset=utf-8"},
        {".txt", "text/plain; charset=utf-8"},
        {".md", "text/plain; charset=utf-8"},
        {".png", "image/png"},
        {".zip", "application/zip"},
        {".mp3", "audio/mpeg"},
        {".ogg", "audio/ogg"},
        {".oga", "audio/ogg"},
        {".opus", "audio/ogg"},
        {".wav", "audio/wav"},
        {".m4a", "audio/mp4"},
        {".aac", "audio/aac"},
        {".flac", "audio/flac"},
        {".webm", "audio/webm"},
    };
    static readonly HashSet<string> audioExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    { ".mp3", ".ogg", ".oga", ".wav", ".m4a", ".aac", ".flac", ".opus", ".webm" };

    static void Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;
        root = Path.GetFullPath(AppDomain.CurrentDomain.BaseDirectory);
        if (!root.EndsWith(Path.DirectorySeparatorChar.ToString())) root += Path.DirectorySeparatorChar;
        if (!File.Exists(Path.Combine(root, "index.html")))
        {
            Console.WriteLine("No s'ha trobat index.html. Posa aquest executable a la carpeta del joc.");
            Console.WriteLine("Prem Retorn per tancar.");
            Console.ReadLine();
            return;
        }
        TcpListener listener = null;
        int port = 3000;
        for (; port <= 3020; port++)
        {
            try { listener = new TcpListener(IPAddress.Loopback, port); listener.Start(); break; }
            catch (SocketException) { listener = null; }
        }
        if (listener == null)
        {
            Console.WriteLine("No s'ha pogut iniciar el servidor: cap port lliure entre el 3000 i el 3020.");
            Console.WriteLine("Prem Retorn per tancar.");
            Console.ReadLine();
            return;
        }
        string url = "http://127.0.0.1:" + port + "/";
        Console.WriteLine();
        Console.WriteLine("Vila Mediterrània");
        Console.WriteLine();
        Console.WriteLine("Obre " + url);
        Console.WriteLine();
        Console.WriteLine("Deixa aquesta finestra oberta mentre jugues. Tanca-la per aturar el servidor.");
        Console.WriteLine();
        if (Array.IndexOf(args, "--sense-navegador") < 0)
        {
            try { Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true }); }
            catch (Exception) { }
        }
        while (true)
        {
            TcpClient client;
            try { client = listener.AcceptTcpClient(); }
            catch (SocketException) { continue; }
            ThreadPool.QueueUserWorkItem(delegate { Handle(client); });
        }
    }

    static void Handle(TcpClient client)
    {
        try
        {
            using (client)
            using (NetworkStream stream = client.GetStream())
            {
                stream.ReadTimeout = 5000;
                string requestLine = ReadLine(stream);
                if (requestLine == null) return;
                string rangeHeader = null;
                while (true)
                {
                    string header = ReadLine(stream);
                    if (string.IsNullOrEmpty(header)) break;
                    if (header.StartsWith("Range:", StringComparison.OrdinalIgnoreCase)) rangeHeader = header.Substring(6).Trim();
                }
                string[] parts = requestLine.Split(' ');
                if (parts.Length < 2) { RespondText(stream, "400 Bad Request", "Petició no vàlida.", false); return; }
                string method = parts[0];
                bool head = method == "HEAD";
                if (method != "GET" && !head)
                {
                    WriteHeaders(stream, "405 Method Not Allowed", "text/plain; charset=utf-8", 0, "no-cache", null, "Allow: GET, HEAD");
                    return;
                }
                string target = parts[1];
                string query = "";
                int mark = target.IndexOf('?');
                if (mark >= 0) { query = target.Substring(mark); target = target.Substring(0, mark); }
                string pathname = Uri.UnescapeDataString(target);
                if (pathname == "/music/playlist.json") { RespondPlaylist(stream, head); return; }
                if (pathname == "/") pathname = "/index.html";
                string file;
                try { file = Path.GetFullPath(Path.Combine(root, "." + pathname.Replace('/', Path.DirectorySeparatorChar))); }
                catch (Exception) { RespondText(stream, "403 Forbidden", "Accés no permès.", head); return; }
                if (!file.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                {
                    RespondText(stream, "403 Forbidden", "Accés no permès.", head);
                    return;
                }
                // Subpages such as /editor-mods/ serve their own index.html. Without the
                // trailing slash their relative imports would resolve against the root.
                if (Directory.Exists(file))
                {
                    if (!target.EndsWith("/")) { Redirect(stream, target + "/" + query); return; }
                    string index = Path.Combine(file, "index.html");
                    if (!File.Exists(index))
                    {
                        RespondText(stream, "404 Not Found", "Aquesta carpeta no té cap index.html.", head);
                        return;
                    }
                    ServeFile(stream, index, head, rangeHeader);
                    return;
                }
                if (!File.Exists(file))
                {
                    RespondText(stream, "404 Not Found", "Fitxer no trobat.", head);
                    return;
                }
                ServeFile(stream, file, head, rangeHeader);
            }
        }
        catch (Exception) { }
    }

    static void ServeFile(Stream stream, string file, bool head, string rangeHeader)
    {
        long size = new FileInfo(file).Length;
        long start = 0, end = size - 1;
        string status = "200 OK", contentRange = null;
        if (rangeHeader != null)
        {
            if (!TryParseRange(rangeHeader, size, out start, out end))
            {
                WriteHeaders(stream, "416 Range Not Satisfiable", "text/plain; charset=utf-8", 0, "no-cache", "bytes */" + size);
                return;
            }
            status = "206 Partial Content";
            contentRange = "bytes " + start + "-" + end + "/" + size;
        }
        string extension = Path.GetExtension(file).ToLowerInvariant();
        string type;
        if (!types.TryGetValue(extension, out type)) type = "application/octet-stream";
        long length = size == 0 ? 0 : end - start + 1;
        WriteHeaders(stream, status, type, length, "no-cache", contentRange);
        if (head || length == 0) return;
        using (FileStream source = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.Read))
        {
            source.Seek(start, SeekOrigin.Begin);
            byte[] buffer = new byte[65536];
            long remaining = length;
            while (remaining > 0)
            {
                int read = source.Read(buffer, 0, (int)Math.Min(buffer.Length, remaining));
                if (read <= 0) break;
                stream.Write(buffer, 0, read);
                remaining -= read;
            }
        }
        stream.Flush();
    }

    // Mateix comportament que el servidor Node: només "bytes=a-b"; qualsevol
    // rang no interpretable o fora del fitxer respon 416.
    static bool TryParseRange(string value, long size, out long start, out long end)
    {
        start = 0; end = size - 1;
        if (!value.StartsWith("bytes=") || size == 0) return false;
        string[] parts = value.Substring(6).Split('-');
        if (parts.Length != 2 || (parts[0].Length == 0 && parts[1].Length == 0)) return false;
        foreach (string part in parts) foreach (char c in part) if (c < '0' || c > '9') return false;
        if (parts[0].Length > 0)
        {
            if (!long.TryParse(parts[0], out start)) return false;
            if (parts[1].Length > 0)
            {
                long requested;
                if (!long.TryParse(parts[1], out requested)) return false;
                end = Math.Min(requested, end);
            }
        }
        else
        {
            long suffix;
            if (!long.TryParse(parts[1], out suffix)) return false;
            start = Math.Max(0, size - suffix);
        }
        return start <= end && start < size;
    }

    static void RespondPlaylist(Stream stream, bool head)
    {
        List<string> files = new List<string>();
        CollectMusic(Path.Combine(root, "music"), "", files);
        files.Sort(StringComparer.InvariantCultureIgnoreCase);
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < files.Count; i++)
        {
            if (i > 0) json.Append(",");
            json.Append('"').Append(EscapeJson(files[i])).Append('"');
        }
        json.Append("]");
        byte[] body = Encoding.UTF8.GetBytes(json.ToString());
        WriteHeaders(stream, "200 OK", types[".json"], body.Length, "no-store", null);
        if (!head && body.Length > 0) stream.Write(body, 0, body.Length);
        stream.Flush();
    }

    static void CollectMusic(string folder, string prefix, List<string> files)
    {
        DirectoryInfo directory = new DirectoryInfo(folder);
        if (!directory.Exists) return;
        foreach (FileSystemInfo entry in directory.GetFileSystemInfos())
        {
            if ((entry.Attributes & FileAttributes.ReparsePoint) != 0) continue;
            if (entry is DirectoryInfo) CollectMusic(entry.FullName, prefix + entry.Name + "/", files);
            else if (audioExtensions.Contains(Path.GetExtension(entry.Name))) files.Add(prefix + entry.Name);
        }
    }

    static string EscapeJson(string value)
    {
        StringBuilder escaped = new StringBuilder();
        foreach (char c in value)
        {
            if (c == '"' || c == '\\') escaped.Append('\\').Append(c);
            else if (c < ' ') escaped.Append("\\u").Append(((int)c).ToString("x4"));
            else escaped.Append(c);
        }
        return escaped.ToString();
    }

    // ReadLine sobre el flux sense buffer extra: no es pot perdre cap byte de la petició.
    static string ReadLine(Stream stream)
    {
        StringBuilder line = new StringBuilder();
        while (line.Length < 8192)
        {
            int b = stream.ReadByte();
            if (b < 0) return line.Length > 0 ? line.ToString() : null;
            if (b == '\n') return line.ToString().TrimEnd('\r');
            line.Append((char)b);
        }
        return line.ToString();
    }

    static void Redirect(Stream stream, string location)
    {
        location = location.Replace("\r", "").Replace("\n", "");
        StringBuilder h = new StringBuilder();
        h.Append("HTTP/1.1 302 Found\r\n");
        h.Append("Location: ").Append(location).Append("\r\n");
        h.Append("Content-Length: 0\r\n");
        h.Append("Cache-Control: no-cache\r\n");
        h.Append("Connection: close\r\n\r\n");
        byte[] headers = Encoding.ASCII.GetBytes(h.ToString());
        stream.Write(headers, 0, headers.Length);
        stream.Flush();
    }

    static void RespondText(Stream stream, string status, string text, bool omitBody)
    {
        byte[] body = Encoding.UTF8.GetBytes(text);
        WriteHeaders(stream, status, "text/plain; charset=utf-8", body.Length, "no-cache", null);
        if (!omitBody && body.Length > 0) stream.Write(body, 0, body.Length);
        stream.Flush();
    }

    static void WriteHeaders(Stream stream, string status, string type, long length, string cache, string contentRange, string extra = null)
    {
        StringBuilder h = new StringBuilder();
        h.Append("HTTP/1.1 ").Append(status).Append("\r\n");
        h.Append("Content-Type: ").Append(type).Append("\r\n");
        h.Append("Content-Length: ").Append(length).Append("\r\n");
        h.Append("Cache-Control: ").Append(cache).Append("\r\n");
        h.Append("X-Content-Type-Options: nosniff\r\n");
        h.Append("Accept-Ranges: bytes\r\n");
        if (contentRange != null) h.Append("Content-Range: ").Append(contentRange).Append("\r\n");
        if (extra != null) h.Append(extra).Append("\r\n");
        h.Append("Connection: close\r\n\r\n");
        byte[] headers = Encoding.ASCII.GetBytes(h.ToString());
        stream.Write(headers, 0, headers.Length);
        stream.Flush();
    }
}
