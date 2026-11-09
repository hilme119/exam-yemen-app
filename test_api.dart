import 'dart:io';
import 'dart:convert';

void main() async {
  final apiKey = 'AIzaSyCysRuT7EGYMaIFKelG2pBBNhNZogZInjI';
  final url = Uri.parse('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\$apiKey');
  
  try {
    final client = HttpClient();
    final request = await client.postUrl(url);
    request.headers.set('Content-Type', 'application/json');
    
    final body = jsonEncode({
      "contents": [{
        "parts": [{"text": "Say hello"}]
      }]
    });
    
    request.write(body);
    final response = await request.close();
    final responseBody = await response.transform(utf8.decoder).join();
    
    print('STATUS: \${response.statusCode}');
    print('BODY: \$responseBody');
  } catch (e) {
    print('ERROR: \$e');
  }
}
