import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:trueastrotalk/config/colors.dart';
import 'package:trueastrotalk/config/environment.dart';
import 'dart:convert';

import 'package:trueastrotalk/services/tokens.dart';
import 'package:flutter_svg/flutter_svg.dart';

class Login extends StatefulWidget {
  const Login({super.key});

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  final String baseApiUrl = Environment.baseApiUrl;
  TextEditingController emailField = TextEditingController();
  TextEditingController passwordField = TextEditingController();
  bool _isPasswordVisible = false;
  late FocusNode _emailFocusNode;
  late FocusNode _passwordFocusNode;

  @override
  void initState() {
    super.initState();
    _emailFocusNode = FocusNode();
    _passwordFocusNode = FocusNode();
  }

  @override
  void dispose() {
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    emailField.dispose();
    passwordField.dispose();
    super.dispose();
  }

  void _focusOnEmail() {
    FocusScope.of(context).requestFocus(_emailFocusNode);
  }

  void _focusOnPassword() {
    FocusScope.of(context).requestFocus(_passwordFocusNode);
  }

  final _formKey = GlobalKey<FormState>();
  bool _isloading = false;

  Future<void> _login() async {
    if (_formKey.currentState != null && _formKey.currentState!.validate()) {
      setState(() {
        _isloading = true;
      });
      final username = emailField.text;
      final password = passwordField.text;

      if (username.isEmpty) {
        _focusOnEmail();
        setState(() {
          _isloading = false;
        });
        return;
      }

      if (password.isEmpty) {
        _focusOnPassword();
        setState(() {
          _isloading = false;
        });
        return;
      }

      final Map<String, String> data = {
        'login': '1',
        'email': emailField.text.trim(),
        'password': passwordField.text.trim(),
      };

      try {
        final response = await http.post(
          Uri.parse('$baseApiUrl/login'),
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
            final loginresponse = jsonDecode(responseData);
            if (loginresponse['status'] == 1) {
              final prefs = await SharedPreferences.getInstance();
              prefs.setBool('is_logged_in', true);
              prefs.setString('user_token', loginresponse['token']);
              prefs.setString('salution', loginresponse['user']['salution']);
              prefs.setString('user_name', loginresponse['user']['first_name'] + ' ' + loginresponse['user']['last_name']);
              prefs.setString('first_name', loginresponse['user']['first_name']);
              prefs.setString('last_name', loginresponse['user']['last_name']);
              prefs.setString('user_email', loginresponse['user']['user_email']);
              prefs.setString('user_phone', loginresponse['user']['user_phone']);
              prefs.setString('user_dob', loginresponse['user']['user_dob']);
              prefs.setString('user_gender', loginresponse['user']['user_gender']);
              prefs.setString('user_type', loginresponse['user']['astro_type']);
              await TokenService().refreshAndUpdateFCMToken();
              Navigator.pushReplacementNamed(context, '/home');
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(loginresponse['message'] ?? 'Login failed')),
              );
            }
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('No data returned from API')),
            );
          }
        } else {
          final loginresponse = jsonDecode(responseData);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Login failed: ${loginresponse.message}')),
          );
        }
      } catch (e) {
        if (!mounted) return;

        setState(() {
          _isloading = false;
        });

        print('Error type: ${e.runtimeType}');
        print('Error value: $e');
        print(e.toString());

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          SvgPicture.asset(
            "assets/images/login-bg.svg",
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
          ),
          Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.only(left: 30.0, right: 30.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.max,
                    children: [
                      const Text(
                        "Login",
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
                        "Please sign in to continue",
                        style: TextStyle(
                          color: Colors.black54,
                          fontSize: 17.0,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(
                        height: 20.0,
                      ),
                      TextFormField(
                        focusNode: _emailFocusNode,
                        controller: emailField,
                        decoration: const InputDecoration(
                          prefixIcon: Padding(
                            padding: EdgeInsets.only(
                              left: 0,
                              right: 10.0,
                            ),
                            child: Icon(
                              Icons.person,
                              color: AppColors.accentColor,
                            ),
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
                          fontSize: 15.0,
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your email';
                          }
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                            return 'Please enter a valid email';
                          }
                          return null;
                        },
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        onFieldSubmitted: (_) => _focusOnPassword(),
                      ),
                      const SizedBox(
                        height: 10.0,
                      ),
                      TextFormField(
                        focusNode: _passwordFocusNode,
                        controller: passwordField,
                        obscureText: !_isPasswordVisible,
                        decoration: InputDecoration(
                          prefixIcon: Padding(
                            padding: EdgeInsets.only(
                              left: 0,
                              right: 10.0,
                            ),
                            child: Icon(
                              Icons.lock,
                              color: AppColors.accentColor,
                            ),
                          ),
                          suffixIcon: Padding(
                            padding: EdgeInsets.only(
                              left: 0,
                              right: 10.0,
                            ),
                            child: GestureDetector(
                              onTap: () {
                                setState(
                                  () {
                                    _isPasswordVisible = !_isPasswordVisible;
                                  },
                                );
                              },
                              child: Icon(
                                _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                              ),
                            ),
                          ),
                          hintText: 'Password',
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
                          fontSize: 15.0,
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your password';
                          }
                          return null;
                        },
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _login(),
                      ),
                      const SizedBox(
                        height: 20.0,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          ElevatedButton(
                            onPressed: _isloading ? null : _login,
                            style: ButtonStyle(
                              backgroundColor: WidgetStatePropertyAll(AppColors.accentColor),
                              foregroundColor: WidgetStatePropertyAll(Colors.white),
                              shape: WidgetStatePropertyAll<RoundedRectangleBorder>(
                                const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.all(Radius.circular(30.0)),
                                  side: BorderSide(
                                    color: AppColors.accentColor,
                                  ),
                                ),
                              ),
                              minimumSize: WidgetStatePropertyAll(const Size(140.0, 55.0)),
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
                                    "Login",
                                    style: TextStyle(
                                      fontSize: 18.0,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.pushReplacementNamed(context, '/forgotpass');
                            },
                            child: const Text(
                              "Forgot Password?",
                              style: TextStyle(
                                color: AppColors.accentColor,
                                fontSize: 16.0,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          )
                        ],
                      ),
                      const SizedBox(
                        height: 40.0,
                      ),
                      Row(
                        children: [
                          const Text(
                            "Don't have an account?",
                            style: TextStyle(
                              color: Color(0xff000000),
                              fontSize: 17.0,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(
                            width: 5.0,
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.pushReplacementNamed(context, '/signup');
                            },
                            child: const Text(
                              "Sign Up",
                              style: TextStyle(
                                color: AppColors.accentColor,
                                fontSize: 17.0,
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
          )
        ],
      ),
    );
  }
}
