import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:trueastrotalk/config/environment.dart';
import 'package:trueastrotalk/screens/login.dart';

class Newpassword extends StatefulWidget {
  final String token;
  final String email;

  const Newpassword({
    super.key,
    required this.token,
    required this.email,
  });

  @override
  NewpasswordState createState() => NewpasswordState();
}

class NewpasswordState extends State<Newpassword> {
  final String baseApiUrl = Environment.baseApiUrl;
  final TextEditingController _newpasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  late FocusNode _newPassFocusNode;
  late FocusNode _confPassFocusNode;
  bool _isPasswordVisible = false;
  bool _isCpasswordVisible = false;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _newPassFocusNode = FocusNode();
    _confPassFocusNode = FocusNode();
  }

  @override
  void dispose() {
    _newPassFocusNode.dispose();
    _confPassFocusNode.dispose();
    super.dispose();
  }

  void _focusOnNewPass() {
    FocusScope.of(context).requestFocus(_newPassFocusNode);
  }

  void _focusOnConfPass() {
    FocusScope.of(context).requestFocus(_confPassFocusNode);
  }

  Future resetPassword() async {
    if (_newpasswordController.text == "") {
      _focusOnNewPass();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("New password can't be empty"),
        ),
      );
      return false;
    }

    if (_confirmPasswordController.text == "") {
      _focusOnConfPass();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Confirm password cant be empty")),
      );
      return false;
    }

    if (_newpasswordController.text != _confirmPasswordController.text) {
      _focusOnConfPass();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Password don't match")),
      );
      return false;
    }

    setState(() {
      _isLoading = true;
    });

    final response = await http.post(
      Uri.parse('$baseApiUrl/api/reset-password'),
      body: {
        'token': widget.token,
        'email': widget.email,
        'password': _newpasswordController.text,
      },
    );

    print(response.statusCode);

    if (response.statusCode == 201) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Password reset successfully"),
          ),
        );
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const Login(),
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Api error"),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        height: double.infinity,
        width: double.infinity,
        decoration: const BoxDecoration(
          image: DecorationImage(
            fit: BoxFit.cover,
            image: AssetImage("assets/images/login-bg.png"),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.only(
              top: 170.0,
              left: 30.0,
              right: 30.0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  "Set New Password",
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 26.0,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(
                  height: 10.0,
                ),
                const Text(
                  "Please enter email to continue",
                  style: TextStyle(
                    color: Colors.black54,
                    fontSize: 17.0,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 20),
                TextField(
                  focusNode: _newPassFocusNode,
                  controller: _newpasswordController,
                  obscureText: !_isPasswordVisible, // Toggle based on state
                  decoration: InputDecoration(
                    prefixIcon: const Padding(
                      padding: EdgeInsets.only(
                        left: 0,
                        right: 10.0,
                      ),
                      child: Icon(Icons.lock),
                    ),
                    suffixIcon: Padding(
                      padding: EdgeInsets.only(
                        left: 0,
                        right: 10.0,
                      ),
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _isPasswordVisible = !_isPasswordVisible;
                          });
                        },
                        child: Icon(
                          _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                        ),
                      ),
                    ),
                    hintText: 'New Password',
                    contentPadding: EdgeInsets.symmetric(
                      vertical: 10,
                    ),
                    prefixIconConstraints: BoxConstraints(
                      minWidth: 0,
                      minHeight: 0,
                    ),
                  ),
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 17.0,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  focusNode: _confPassFocusNode,
                  controller: _confirmPasswordController,
                  obscureText: !_isCpasswordVisible, // Toggle based on state
                  decoration: InputDecoration(
                    prefixIcon: const Padding(
                      padding: EdgeInsets.only(
                        left: 0,
                        right: 10.0,
                      ),
                      child: Icon(Icons.lock),
                    ),
                    suffixIcon: Padding(
                      padding: EdgeInsets.only(
                        left: 0,
                        right: 10.0,
                      ),
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _isCpasswordVisible = !_isCpasswordVisible;
                          });
                        },
                        child: Icon(
                          _isCpasswordVisible ? Icons.visibility : Icons.visibility_off,
                        ),
                      ),
                    ),
                    hintText: 'Confirm Password',
                    contentPadding: EdgeInsets.symmetric(
                      vertical: 10,
                    ),
                    prefixIconConstraints: BoxConstraints(
                      minWidth: 0,
                      minHeight: 0,
                    ),
                  ),
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 17.0,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ElevatedButton(
                      onPressed: () => {resetPassword()},
                      style: const ButtonStyle(
                        backgroundColor: WidgetStatePropertyAll(Color(0xffFFE70D)),
                        foregroundColor: WidgetStatePropertyAll(Colors.black),
                        shape: WidgetStatePropertyAll<RoundedRectangleBorder>(
                          RoundedRectangleBorder(
                            borderRadius: BorderRadius.all(Radius.circular(30.0)),
                            side: BorderSide(
                              color: Color(0xffFFE70D),
                            ),
                          ),
                        ),
                        minimumSize: WidgetStatePropertyAll(Size(140.0, 55.0)),
                      ),
                      child: _isLoading
                          ? const Row(
                              mainAxisAlignment: MainAxisAlignment.start,
                              children: [
                                SizedBox(
                                  width: 20.0,
                                  height: 20.0,
                                  child: CircularProgressIndicator(
                                    color: Colors.black,
                                    strokeWidth: 2.0,
                                  ),
                                ),
                                SizedBox(
                                  width: 10.0,
                                ),
                                Text(
                                  "Processing...",
                                  style: TextStyle(
                                    fontSize: 16.0,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            )
                          : const Text(
                              "Save Password",
                              style: TextStyle(
                                fontSize: 16.0,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
