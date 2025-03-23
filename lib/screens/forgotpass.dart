import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:trueastrotalk/config/environment.dart';
import 'dart:convert';
import 'package:trueastrotalk/screens/login.dart';

class Forgotpass extends StatefulWidget {
  const Forgotpass({super.key});

  @override
  State<Forgotpass> createState() => _ForgotpassState();
}

class _ForgotpassState extends State<Forgotpass> {
  final String baseApiUrl = Environment.baseApiUrl;
  final _formKey = GlobalKey<FormState>();
  bool _isloading = false;

  TextEditingController emailField = TextEditingController();
  late FocusNode _emailFocusNode;

  @override
  void initState() {
    super.initState();
    _emailFocusNode = FocusNode();
  }

  @override
  void dispose() {
    _emailFocusNode.dispose();
    super.dispose();
  }

  void _focusOnEmail() {
    FocusScope.of(context).requestFocus(_emailFocusNode);
  }

  Future _forgotpass() async {
    if (_formKey.currentState != null && _formKey.currentState!.validate()) {
      setState(() {
        _isloading = true;
      });
      final username = emailField.text;

      if (username == "") {
        _focusOnEmail();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      final Map<String, String> data = {
        'login': '1',
        'email': emailField.text.trim(),
      };

      final response = await http.post(
        Uri.parse('$baseApiUrl/forgotpass'),
        headers: <String, String>{
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
      );

      if (!mounted) return;

      setState(() {
        _isloading = false;
      });

      final responseData = response.body;
      if (response.statusCode == 201) {
        if (responseData.isNotEmpty) {
          final response = jsonDecode(responseData);
          if (response['status'] == 1) {
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (BuildContext context) {
                return OrientationBuilder(
                  builder: (context, orientation) {
                    return Dialog(
                      insetPadding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20.0),
                      ),
                      child: Container(
                        width: orientation == Orientation.portrait ? MediaQuery.of(context).size.width * 0.9 : MediaQuery.of(context).size.width * 0.7,
                        constraints: BoxConstraints(
                          maxHeight: MediaQuery.of(context).size.height * 0.8,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Flexible(
                              child: SingleChildScrollView(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.all(16.0),
                                      child: Center(
                                        child: Container(
                                          padding: const EdgeInsets.all(8.0),
                                          decoration: BoxDecoration(
                                            border: Border.all(
                                              color: const Color(0xff008000),
                                              width: 2.0,
                                            ),
                                            borderRadius: BorderRadius.circular(50.0),
                                          ),
                                          child: const Icon(
                                            Icons.check,
                                            size: 35.0,
                                            color: Color(0xff008000),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const Padding(
                                      padding: EdgeInsets.only(top: 15.0),
                                      child: Text(
                                        "Email Sent Successfully!",
                                        style: TextStyle(
                                          fontSize: 20.0,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(20.0),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          RichText(
                                            textAlign: TextAlign.center,
                                            text: const TextSpan(
                                              style: TextStyle(
                                                fontSize: 17.0,
                                                color: Colors.black,
                                              ),
                                              children: <TextSpan>[
                                                TextSpan(
                                                  text: "Thank you, an email has been sent with instructions to reset your password. ",
                                                ),
                                                TextSpan(
                                                  text: "We're thrilled to have you on back. ",
                                                  style: TextStyle(fontWeight: FontWeight.bold),
                                                ),
                                                TextSpan(
                                                  text: "Please take a moment to check your email and log in.",
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(height: 20.0),
                                          const Text(
                                            "We're still committed to making your journey with us enjoyable.",
                                            style: TextStyle(fontSize: 17.0),
                                            textAlign: TextAlign.center,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: ElevatedButton(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) => const Login(),
                                    ),
                                  );
                                },
                                style: ButtonStyle(
                                  backgroundColor: const WidgetStatePropertyAll(Color(0xffFFE70D)),
                                  foregroundColor: const WidgetStatePropertyAll(Colors.black),
                                  shape: WidgetStatePropertyAll<RoundedRectangleBorder>(
                                    RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(30.0),
                                      side: const BorderSide(
                                        color: Color(0xffFFE70D),
                                      ),
                                    ),
                                  ),
                                  minimumSize: const WidgetStatePropertyAll(
                                    Size(
                                      140.0,
                                      55.0,
                                    ),
                                  ),
                                ),
                                child: const Text(
                                  'Login',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontFamily: 'OpenSans',
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            );
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No data returned from API')),
          );
        }
      } else {
        if (response.statusCode == 500) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to send email')),
          );
        }
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
          child: SingleChildScrollView(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.only(
                  top: 170.0,
                  left: 30.0,
                  right: 30.0,
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.max,
                    children: [
                      const Text(
                        "Forgot Password?",
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
                      const SizedBox(
                        height: 20.0,
                      ),
                      TextField(
                        focusNode: _emailFocusNode,
                        controller: emailField,
                        decoration: const InputDecoration(
                          prefixIcon: Padding(
                            padding: EdgeInsets.only(
                              left: 0,
                              right: 10.0,
                            ),
                            child: Icon(Icons.person),
                          ),
                          hintText: 'Email address',
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
                          fontSize: 16.0,
                        ),
                      ),
                      const SizedBox(
                        height: 15.0,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          ElevatedButton(
                            onPressed: () => {_forgotpass()},
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
                            child: _isloading
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
                                    "Reset Password",
                                    style: TextStyle(
                                      fontSize: 16.0,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                      const SizedBox(
                        height: 30.0,
                      ),
                      Row(
                        children: [
                          const Text(
                            "Continue to Login?",
                            style: TextStyle(
                              color: Color(0xff000000),
                              fontSize: 16.0,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(
                            width: 5.0,
                          ),
                          GestureDetector(
                            onTap: () => {
                              Navigator.pushReplacementNamed(context, '/login'),
                            },
                            child: const Text(
                              "Login",
                              style: TextStyle(
                                color: Color(0xff000000),
                                fontSize: 16.0,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          )
                        ],
                      ),
                      const SizedBox(
                        height: 30.0,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
