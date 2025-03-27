import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:http/http.dart' as http;
import 'package:trueastrotalk/config/colors.dart';
import 'dart:convert';
import 'package:trueastrotalk/config/environment.dart';
import 'package:trueastrotalk/common/international_phone_field.dart';

class Signup extends StatefulWidget {
  const Signup({super.key});

  @override
  State<Signup> createState() => _SignupState();
}

class _SignupState extends State<Signup> {
  final String baseApiUrl = Environment.baseApiUrl;

  // Form fields
  final TextEditingController salutionField = TextEditingController();
  final TextEditingController firstNameField = TextEditingController();
  final TextEditingController lastNameField = TextEditingController();
  final TextEditingController emailField = TextEditingController();
  final TextEditingController phoneField = TextEditingController();
  final TextEditingController passwordField = TextEditingController();
  final TextEditingController cpasswordField = TextEditingController();
  late TextEditingController dobField = TextEditingController();
  late TextEditingController birthPlaceField = TextEditingController();
  late TextEditingController birthTimeField = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isCpasswordVisible = false;

  late FocusNode _firstNameFocusNode;
  late FocusNode _lastNameFocusNode;
  late FocusNode _emailFocusNode;
  late FocusNode _phoneFocusNode;
  late FocusNode _passwordFocusNode;
  late FocusNode _cpasswordFocusNode;
  late FocusNode _birthPlaceFocusNode;
  late FocusNode _birthTimeFocusNode;

  final _formKey = GlobalKey<FormState>();
  bool _isloading = false;

  // Selected title value
  String? _selectedSalution;

  // Selected gender value
  String? _selectedGender;

  // List of title options
  final List<String> _salutionOptions = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.', 'Prof.'];

  // List of gender options
  final List<String> _genderOptions = ['Male', 'Female', 'Other'];

  @override
  void initState() {
    super.initState();
    _firstNameFocusNode = FocusNode();
    _lastNameFocusNode = FocusNode();
    _emailFocusNode = FocusNode();
    _phoneFocusNode = FocusNode();
    _passwordFocusNode = FocusNode();
    _cpasswordFocusNode = FocusNode();
    _birthPlaceFocusNode = FocusNode();
    _birthTimeFocusNode = FocusNode();
  }

  @override
  void dispose() {
    _firstNameFocusNode.dispose();
    _lastNameFocusNode.dispose();
    _emailFocusNode.dispose();
    _phoneFocusNode.dispose();
    _passwordFocusNode.dispose();
    _cpasswordFocusNode.dispose();
    _birthPlaceFocusNode.dispose();
    _birthTimeFocusNode.dispose();
    super.dispose();
  }

  void _focusOnFirstName() {
    FocusScope.of(context).requestFocus(_firstNameFocusNode);
  }

  void _focusOnLastName() {
    FocusScope.of(context).requestFocus(_lastNameFocusNode);
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

  void _focusOnBirthPlace() {
    FocusScope.of(context).requestFocus(_birthPlaceFocusNode);
  }

  void _focusOnBirthTime() {
    FocusScope.of(context).requestFocus(_birthTimeFocusNode);
  }

  Future _signup() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isloading = true;
      });

      final salution = _selectedSalution.toString();
      final firstname = firstNameField.text.trim();
      final lastname = lastNameField.text.trim();
      final emailadd = emailField.text.trim();
      final passwrd = passwordField.text.trim();
      final cpasswrd = cpasswordField.text.trim();
      final phonenum = phoneField.text.trim();
      final gender = _selectedGender.toString().trim();
      final birthplace = birthPlaceField.text.trim();
      final birthtime = birthTimeField.text.trim();

      if (firstname == "") {
        _focusOnFirstName();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      if (lastname == "") {
        _focusOnLastName();
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

      if (passwrd == "") {
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

      if (passwrd != cpasswrd) {
        _focusOnCpassword();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      if (birthplace == "") {
        _focusOnBirthPlace();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      if (birthtime == "") {
        _focusOnBirthTime();
        setState(() {
          _isloading = false;
        });
        return false;
      }

      print(salution);
      print(firstname);
      print(lastname);
      print(emailadd);
      print(passwrd);
      print(cpasswrd);
      print(phonenum);
      print(gender);
      print(birthplace);
      print(birthtime);

      final Map<String, String> data = {
        'signup': '1',
        'salution': salution,
        'firstname': firstname,
        'lastname': lastname,
        'gender': gender,
        'email': emailadd,
        'password': passwrd,
        'phone': phonenum,
        'birthplace': birthplace,
        'birthtime': birthtime,
      };

      print(baseApiUrl);

      final response = await http.post(
        Uri.parse('${baseApiUrl}/signup'),
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

      if (response.statusCode == 422) {
        print('Validation error: ${response.body}');
      }

      if (response.statusCode == 201) {
        final responseData = response.body;
        if (responseData.isNotEmpty) {
          final signupresponse = jsonDecode(responseData);
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
    final double rowGap = 28;
    final double colGap = 15;

    return Scaffold(
      body: Stack(children: [
        SvgPicture.asset(
          "assets/images/login-bg.svg",
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
        ),
        SafeArea(
          child: SingleChildScrollView(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.only(
                  top: 60.0,
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
                      Text(
                        "Full name",
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14.0,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(
                        height: 1.0,
                      ),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 2,
                            child: Theme(
                              data: Theme.of(context).copyWith(
                                popupMenuTheme: PopupMenuThemeData(
                                  menuPadding: EdgeInsets.symmetric(horizontal: 8.0),
                                ),
                              ),
                              child: DropdownButtonFormField<String>(
                                value: _selectedSalution,
                                decoration: const InputDecoration(
                                  contentPadding: EdgeInsets.symmetric(
                                    horizontal: 0,
                                    vertical: 0,
                                  ),
                                  hintText: 'Title',
                                ),
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 15.0,
                                ),
                                hint: const Text('Title'),
                                isExpanded: true,
                                icon: const Icon(Icons.arrow_drop_down),
                                menuMaxHeight: 320,
                                alignment: AlignmentDirectional.centerStart,
                                items: _salutionOptions.map((String title) {
                                  return DropdownMenuItem<String>(
                                    value: title,
                                    child: Padding(
                                      padding: const EdgeInsets.only(left: 0.0),
                                      child: Text(title),
                                    ),
                                  );
                                }).toList(),
                                onChanged: (String? newValue) {
                                  setState(() {
                                    _selectedSalution = newValue;
                                  });
                                },
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Required';
                                  }
                                  return null;
                                },
                              ),
                            ),
                          ),
                          SizedBox(width: colGap),
                          Expanded(
                            flex: 3,
                            child: TextFormField(
                              focusNode: _firstNameFocusNode,
                              controller: firstNameField,
                              decoration: const InputDecoration(
                                hintText: 'First name',
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
                                  return 'Required';
                                }
                                return null;
                              },
                              keyboardType: TextInputType.text,
                              textInputAction: TextInputAction.next,
                              onFieldSubmitted: (_) => _focusOnLastName(),
                            ),
                          ),
                          SizedBox(width: colGap),
                          Expanded(
                            flex: 3,
                            child: TextFormField(
                              focusNode: _lastNameFocusNode,
                              controller: lastNameField,
                              decoration: const InputDecoration(
                                hintText: 'Last name',
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
                                  return 'Required';
                                }
                                return null;
                              },
                              keyboardType: TextInputType.text,
                              textInputAction: TextInputAction.next,
                              onFieldSubmitted: (_) => _focusOnEmail(),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: rowGap),
                      Text(
                        "Email address",
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14.0,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(
                        height: 1.0,
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
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Email is required!';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: rowGap),
                      Text(
                        "Passwords",
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14.0,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(
                        height: 1.0,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Expanded(
                            flex: 3,
                            child: TextField(
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
                          ),
                          SizedBox(width: colGap),
                          Expanded(
                            flex: 3,
                            child: TextField(
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
                                hintText: 'Confirm',
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
                          ),
                        ],
                      ),
                      SizedBox(height: rowGap),
                      Text(
                        "Phone number",
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14.0,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(
                        height: 1.0,
                      ),
                      InternationalPhoneField(
                        focusNode: _phoneFocusNode,
                        controller: phoneField,
                      ),
                      SizedBox(height: rowGap),
                      Text(
                        "Gender, Birth place & Time",
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14.0,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(
                        height: 1.0,
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Expanded(
                            child: Theme(
                              data: Theme.of(context).copyWith(
                                popupMenuTheme: PopupMenuThemeData(
                                  menuPadding: EdgeInsets.symmetric(horizontal: 8.0),
                                ),
                              ),
                              child: DropdownButtonFormField<String>(
                                value: _selectedSalution,
                                decoration: const InputDecoration(
                                  contentPadding: EdgeInsets.symmetric(
                                    horizontal: 0,
                                    vertical: 0,
                                  ),
                                  hintText: 'Gender',
                                ),
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 15.0,
                                ),
                                hint: const Text('Gender'),
                                isExpanded: true,
                                icon: const Icon(Icons.arrow_drop_down),
                                menuMaxHeight: 320,
                                alignment: AlignmentDirectional.centerStart,
                                items: _genderOptions.map((String gender) {
                                  return DropdownMenuItem<String>(
                                    value: gender,
                                    child: Padding(
                                      padding: const EdgeInsets.only(left: 0.0),
                                      child: Text(gender),
                                    ),
                                  );
                                }).toList(),
                                onChanged: (String? newValue) {
                                  setState(() {
                                    _selectedGender = newValue;
                                  });
                                },
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Required';
                                  }
                                  return null;
                                },
                              ),
                            ),
                          ),
                          SizedBox(width: colGap),
                          Expanded(
                            child: TextFormField(
                              focusNode: _birthPlaceFocusNode,
                              controller: birthPlaceField,
                              decoration: const InputDecoration(
                                prefixIcon: Padding(
                                  padding: EdgeInsets.only(
                                    left: 0,
                                    right: 10.0,
                                  ),
                                  child: Icon(
                                    Icons.location_city,
                                    size: 20,
                                  ),
                                ),
                                hintText: 'Birth place',
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
                          ),
                          SizedBox(width: colGap),
                          Expanded(
                            child: TextFormField(
                              focusNode: _birthTimeFocusNode,
                              controller: birthTimeField,
                              decoration: const InputDecoration(
                                prefixIcon: Padding(
                                  padding: EdgeInsets.only(
                                    left: 0,
                                    right: 10.0,
                                  ),
                                  child: Icon(
                                    Icons.access_time_outlined,
                                    size: 20,
                                  ),
                                ),
                                hintText: 'Birth time',
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
                                  return 'Time is required!';
                                }
                                return null;
                              },
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: rowGap),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          ElevatedButton(
                            onPressed: () => {
                              _signup(),
                            },
                            style: const ButtonStyle(
                              backgroundColor: WidgetStatePropertyAll(AppColors.accentColor),
                              foregroundColor: WidgetStatePropertyAll(Colors.white),
                              shape: WidgetStatePropertyAll<RoundedRectangleBorder>(
                                RoundedRectangleBorder(
                                  borderRadius: BorderRadius.all(Radius.circular(30.0)),
                                  side: BorderSide(
                                    color: AppColors.accentColor,
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
                                          color: Colors.white,
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
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  )
                                : const Text(
                                    "Create account",
                                    style: TextStyle(
                                      fontSize: 17.0,
                                      fontWeight: FontWeight.w500,
                                      letterSpacing: 0.0,
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
                            "Already have an account?",
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
                            onTap: () => {Navigator.pushReplacementNamed(context, '/login')},
                            child: const Text(
                              "Login",
                              style: TextStyle(
                                color: AppColors.accentColor,
                                fontSize: 16.0,
                                fontWeight: FontWeight.w800,
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
      ]),
    );
  }
}
