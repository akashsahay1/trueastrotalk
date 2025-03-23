import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:trueastrotalk/config/environment.dart';

class Signup extends StatefulWidget {
  const Signup({super.key});

  @override
  State<Signup> createState() => _SignupState();
}

class _SignupState extends State<Signup> {
  final String baseUrl = Environment.baseApiUrl;
  final TextEditingController fullName = TextEditingController();
  final TextEditingController emailField = TextEditingController();
  final TextEditingController phoneField = TextEditingController();
  final TextEditingController passwordField = TextEditingController();
  final TextEditingController cpasswordField = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isCpasswordVisible = false;

  late FocusNode _fullNameFocusNode;
  late FocusNode _emailFocusNode;
  late FocusNode _phoneFocusNode;
  late FocusNode _passwordFocusNode;
  late FocusNode _cpasswordFocusNode;

  final _formKey = GlobalKey<FormState>();
  bool _isloading = false;

  @override
  void initState() {
    super.initState();
    _fullNameFocusNode = FocusNode();
    _emailFocusNode = FocusNode();
    _phoneFocusNode = FocusNode();
    _passwordFocusNode = FocusNode();
    _cpasswordFocusNode = FocusNode();
  }

  @override
  void dispose() {
    _fullNameFocusNode.dispose();
    _emailFocusNode.dispose();
    _phoneFocusNode.dispose();
    _passwordFocusNode.dispose();
    _cpasswordFocusNode.dispose();
    super.dispose();
  }

  void _focusOnFullname() {
    FocusScope.of(context).requestFocus(_fullNameFocusNode);
  }

  void _focusOnEmail() {
    FocusScope.of(context).requestFocus(_emailFocusNode);
  }

  void _focusOnPhone() {
    FocusScope.of(context).requestFocus(_phoneFocusNode);
  }

  void _focusOnPassword() {
    FocusScope.of(context).requestFocus(_passwordFocusNode);
  }

  void _focusOnCpassword() {
    FocusScope.of(context).requestFocus(_cpasswordFocusNode);
  }

  Future _signup() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isloading = true;
      });

      final fullname = fullName.text;
      final emailadd = emailField.text;
      final phonenum = phoneField.text;
      final pwasswrd = passwordField.text;
      final cpasswrd = cpasswordField.text;

      if (fullname == "") {
        _focusOnFullname();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      if (emailadd == "") {
        _focusOnEmail();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      if (phonenum == "") {
        _focusOnPhone();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      if (pwasswrd == "") {
        _focusOnPassword();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      if (cpasswrd == "") {
        _focusOnCpassword();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      if (pwasswrd != cpasswrd) {
        _focusOnCpassword();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      print(fullName.text.trim());
      print(emailField.text.trim());
      print(phoneField.text.trim());
      print(passwordField.text.trim());

      final Map<String, String> data = {
        'signup': '1',
        'fullname': fullName.text.trim(),
        'email': emailField.text.trim(),
        'phone': phoneField.text.trim(),
        'password': passwordField.text.trim(),
      };

      final response = await http.post(
        Uri.parse(baseUrl),
        headers: <String, String>{
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
      );

      if (!mounted) return;

      setState(() {
        _isloading = false;
      });

      print(response.statusCode);

      if (response.statusCode == 201) {
        final responseData = response.body;
        if (responseData.isNotEmpty) {
          final signupresponse = jsonDecode(responseData);
          print(signupresponse);
          if (signupresponse['status'] == 1) {
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
                                        "Account Created Successfully",
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
                                                  text: "Thank you for creating your account with us! ",
                                                ),
                                                TextSpan(
                                                  text: "We're thrilled to have you on board. ",
                                                  style: TextStyle(fontWeight: FontWeight.bold),
                                                ),
                                                TextSpan(
                                                  text: "Please take a moment to log in and set up your new account.",
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(height: 20.0),
                                          const Text(
                                            "By doing so, you'll be able to personalize your experience.",
                                            style: TextStyle(fontSize: 17.0),
                                            textAlign: TextAlign.center,
                                          ),
                                          const SizedBox(height: 20.0),
                                          const Text(
                                            "We're committed to making your journey with us enjoyable and tailored to your preferences.",
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
                                  Navigator.pushReplacementNamed(context, '/login');
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
                                  'Get Started',
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to create account')),
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
            image: AssetImage("assets/images/login-bg.jpg"),
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.only(
                  top: 80.0,
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
                        "Create Account",
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 26.0,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 5.0),
                      const Text(
                        "Please sign up to continue",
                        style: TextStyle(
                          color: Colors.black54,
                          fontSize: 15.0,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      const SizedBox(height: 20.0),
                      TextField(
                        focusNode: _fullNameFocusNode,
                        controller: fullName,
                        decoration: const InputDecoration(
                          prefixIcon: Padding(
                            padding: EdgeInsets.only(
                              left: 0,
                              right: 10.0,
                            ),
                            child: Icon(
                              Icons.face,
                              size: 20,
                            ),
                          ),
                          hintText: 'Full Name',
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
                      ),
                      const SizedBox(
                        height: 10.0,
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
                            child: Icon(
                              Icons.email,
                              size: 20,
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
                      ),
                      const SizedBox(
                        height: 10.0,
                      ),
                      TextField(
                        focusNode: _phoneFocusNode,
                        controller: phoneField,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          prefixIcon: Padding(
                            padding: EdgeInsets.only(
                              left: 0,
                              right: 10.0,
                            ),
                            child: Icon(
                              Icons.phone,
                              size: 20,
                            ),
                          ),
                          hintText: 'Phone number',
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
                      ),
                      const SizedBox(
                        height: 10.0,
                      ),
                      TextField(
                        focusNode: _passwordFocusNode,
                        controller: passwordField,
                        obscureText: !_isPasswordVisible, // Toggle based on state
                        decoration: InputDecoration(
                          prefixIcon: const Padding(
                            padding: EdgeInsets.only(
                              left: 0,
                              right: 10.0,
                            ),
                            child: Icon(
                              Icons.lock,
                              size: 20,
                            ),
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
                      ),
                      const SizedBox(
                        height: 20.0,
                      ),
                      TextField(
                        focusNode: _cpasswordFocusNode,
                        controller: cpasswordField,
                        obscureText: !_isCpasswordVisible,
                        decoration: InputDecoration(
                          prefixIcon: Padding(
                            padding: EdgeInsets.only(
                              left: 0,
                              right: 10.0,
                            ),
                            child: Icon(
                              Icons.lock,
                              size: 20,
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
                                    _isCpasswordVisible = !_isCpasswordVisible;
                                  },
                                );
                              },
                              child: Icon(
                                _isCpasswordVisible ? Icons.visibility : Icons.visibility_off,
                              ),
                            ),
                          ),
                          hintText: 'Confirm password',
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
                      ),
                      const SizedBox(
                        height: 30.0,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          ElevatedButton(
                            onPressed: () => {
                              _signup(),
                            },
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
                                    "Create account",
                                    style: TextStyle(
                                      color: Colors.black,
                                      fontSize: 17.0,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.0,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                      const SizedBox(
                        height: 40.0,
                      ),
                      Row(
                        children: [
                          const Text(
                            "Already have an account?",
                            style: TextStyle(
                              color: Color(0xff000000),
                              fontSize: 18.0,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(
                            width: 5.0,
                          ),
                          GestureDetector(
                            onTap: () => {Navigator.pushReplacementNamed(context, '/login')},
                            child: const Text(
                              "Login",
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 18.0,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          )
                        ],
                      )
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
