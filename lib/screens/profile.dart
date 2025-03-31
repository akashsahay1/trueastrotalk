import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:trueastrotalk/common/international_phone_field.dart';
import 'package:trueastrotalk/config/colors.dart';
import 'package:trueastrotalk/config/environment.dart';

class Profile extends StatefulWidget {
  const Profile({super.key});

  @override
  State<Profile> createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  final String baseApiUrl = Environment.baseApiUrl;
  late TextEditingController firstnameField = TextEditingController();
  late TextEditingController lastnameField = TextEditingController();
  late TextEditingController emailField = TextEditingController();
  late TextEditingController phoneField = TextEditingController();
  late TextEditingController dobField = TextEditingController();
  late FocusNode _firstnameFocusNode;
  late FocusNode _lastnameFocusNode;
  late FocusNode _emailFocusNode;
  late FocusNode _phoneFocusNode;
  late FocusNode _dobFocusNode;

  // Selected title value
  String? _selectedTitle;

  // Selected gender value
  String? _selectedGender;

  // List of title options
  final List<String> _titleOptions = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.', 'Prof.'];

  // List of gender options
  final List<String> _genderOptions = ['Male', 'Female', 'Other'];

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _firstnameFocusNode = FocusNode();
    _lastnameFocusNode = FocusNode();
    _emailFocusNode = FocusNode();
    _phoneFocusNode = FocusNode();
    _dobFocusNode = FocusNode();
  }

  // Method to load user data from storage or API
  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();

    print(prefs.getString('user_dob'));
    print(convertDateFormatForDisplay(prefs.getString('user_dob') ?? ""));

    setState(() {
      _selectedTitle = prefs.getString('title') ?? "Mr.";
      firstnameField.text = prefs.getString('first_name') ?? "";
      lastnameField.text = prefs.getString('last_name') ?? "";
      emailField.text = prefs.getString('user_email') ?? "";
      phoneField.text = prefs.getString('user_phone') ?? "";
      _selectedGender = prefs.getString('user_gender') ?? "Male";
      dobField.text = convertDateFormatForDisplay(prefs.getString('user_dob') ?? "");
    });
  }

  @override
  void dispose() {
    _firstnameFocusNode.dispose();
    _lastnameFocusNode.dispose();
    _emailFocusNode.dispose();
    _phoneFocusNode.dispose();
    _dobFocusNode.dispose();
    emailField.dispose();
    phoneField.dispose();
    dobField.dispose();
    super.dispose();
  }

  void _focusOnFirstname() {
    FocusScope.of(context).requestFocus(_firstnameFocusNode);
  }

  void _focusOnLastname() {
    FocusScope.of(context).requestFocus(_lastnameFocusNode);
  }

  void _focusOnEmail() {
    FocusScope.of(context).requestFocus(_emailFocusNode);
  }

  void _focusOnPhone() {
    FocusScope.of(context).requestFocus(_phoneFocusNode);
  }

  void _focusOnDob() {
    FocusScope.of(context).requestFocus(_dobFocusNode);
  }

  // Show date picker for date of birth
  Future<void> _selectDate(BuildContext context) async {
    DateTime initialDate;
    if (dobField.text.isNotEmpty) {
      try {
        // Parse the date properly using the correct format
        initialDate = DateFormat('dd-MM-yyyy').parse(dobField.text);

        // Validate that the date is not before 1900
        // If it is, use a default instead
        if (initialDate.isBefore(DateTime(1900))) {
          initialDate = DateTime.now().subtract(const Duration(days: 365 * 18));
        }
      } catch (e) {
        // If parsing fails, use default date (18 years ago)
        initialDate = DateTime.now().subtract(const Duration(days: 365 * 18));
      }
    } else {
      // If field is empty, use default date (18 years ago)
      initialDate = DateTime.now().subtract(const Duration(days: 365 * 18));
    }

    // Add some debug printing to see what's happening
    //print('Initial date being used: $initialDate');

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            primaryColor: const Color.fromARGB(1, 173, 173, 174),
            colorScheme: ColorScheme.light(
              primary: Colors.black,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
            buttonTheme: const ButtonThemeData(textTheme: ButtonTextTheme.primary),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        dobField.text = DateFormat('dd-MM-yyyy').format(picked);
      });
    }
  }

  final _formKey = GlobalKey<FormState>();
  bool _isloading = false;

  String convertDateFormatForApi(String displayDate) {
    try {
      final DateFormat displayFormat = DateFormat('dd-MM-yyyy');
      final DateFormat apiFormat = DateFormat('yyyy-MM-dd');
      final DateTime dateTime = displayFormat.parse(displayDate);
      return apiFormat.format(dateTime);
    } catch (e) {
      return displayDate;
    }
  }

  String convertDateFormatForDisplay(String apiDate) {
    try {
      final DateFormat apiFormat = DateFormat('yyyy-MM-dd');
      final DateFormat displayFormat = DateFormat('dd-MM-yyyy');
      final DateTime dateTime = apiFormat.parse(apiDate);
      return displayFormat.format(dateTime);
    } catch (e) {
      return apiDate;
    }
  }

  Future<void> _update() async {
    if (_formKey.currentState != null && _formKey.currentState!.validate()) {
      setState(() {
        _isloading = true;
      });

      final firstname = firstnameField.text.trim();
      final lastname = lastnameField.text.trim();
      final username = emailField.text;
      final userphone = phoneField.text;
      final dob = dobField.text;

      if (firstname.isEmpty) {
        _focusOnFirstname();
        setState(() {
          _isloading = false;
        });
        return;
      }

      if (lastname.isEmpty) {
        _focusOnLastname();
        setState(() {
          _isloading = false;
        });
        return;
      }

      if (username.isEmpty) {
        _focusOnEmail();
        setState(() {
          _isloading = false;
        });
        return;
      }

      if (userphone.isEmpty) {
        _focusOnPhone();
        setState(() {
          _isloading = false;
        });
        return;
      }

      if (dob.isEmpty) {
        _focusOnDob();
        setState(() {
          _isloading = false;
        });
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('user_token') ?? '';

      final Map<String, String> data = {
        'salution': _selectedTitle!,
        'first_name': firstname,
        'last_name': lastname,
        'user_email': username,
        'user_phone': userphone,
        'user_gender': _selectedGender!,
        'user_dob': convertDateFormatForApi(dob),
        'user_country': '',
        'user_state': '',
        'user_city': '',
        'user_about': '',
      };

      try {
        final response = await http.post(
          Uri.parse('${baseApiUrl}/update'),
          headers: <String, String>{
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode(data),
        );

        if (!mounted) return;

        setState(() {
          _isloading = false;
        });

        final responseData = response.body;
        if (responseData.isNotEmpty) {
          final updateResponse = jsonDecode(responseData);
          if (response.statusCode == 200) {
            if (updateResponse['status'] == 1) {
              final userData = updateResponse['data']['user'];
              final prefs = await SharedPreferences.getInstance();
              prefs.setBool('is_logged_in', true);
              prefs.setString('salution', userData['salution'] ?? '');
              prefs.setString('first_name', userData['first_name'] ?? '');
              prefs.setString('last_name', userData['last_name'] ?? '');
              prefs.setString('user_name', '${userData['first_name'] ?? ''} ${userData['last_name'] ?? ''}');
              prefs.setString('user_email', userData['user_email'] ?? '');
              prefs.setString('user_phone', userData['user_phone'] ?? '');
              prefs.setString('user_dob', convertDateFormatForDisplay(userData['user_dob']));
              prefs.setString('user_type', userData['astro_type'] ?? '');
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(updateResponse['message'] ?? 'Profile updated successfully')),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(updateResponse['message'] ?? 'Update failed')),
              );
            }
          } else if (response.statusCode == 401) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Authentication failed. Please log in again.')),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Update failed: ${updateResponse['message'] ?? response.statusCode}')),
            );
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No data returned from API')),
          );
        }
      } catch (e) {
        if (!mounted) return;
        setState(() {
          _isloading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  _showNotifications() {
    Navigator.pushReplacementNamed(context, '/notifications');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Profile',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
        backgroundColor: Color(0xFFFFFFFF),
        foregroundColor: Colors.black,
        actions: [
          IconButton(
            icon: Icon(Icons.notifications),
            onPressed: _showNotifications,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    const SizedBox(
                      height: 10.0,
                    ),
                    const Text(
                      "Update Profile",
                      style: TextStyle(
                        color: Colors.black54,
                        fontSize: 17.0,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(
                      height: 20.0,
                    ),
                    Text(
                      "Full name",
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 14.0,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(
                      height: 8.0,
                    ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 1,
                          child: Theme(
                            data: Theme.of(context).copyWith(
                              popupMenuTheme: PopupMenuThemeData(
                                menuPadding: EdgeInsets.symmetric(horizontal: 8.0),
                              ),
                            ),
                            child: DropdownButtonFormField<String>(
                              value: _selectedTitle,
                              decoration: const InputDecoration(
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 0,
                                  vertical: 0,
                                ),
                                hintText: 'Title',
                              ),
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 17.0,
                              ),
                              hint: const Text('Title'),
                              isExpanded: true,
                              icon: const Icon(Icons.arrow_drop_down),
                              menuMaxHeight: 320,
                              alignment: AlignmentDirectional.centerStart,
                              items: _titleOptions.map((String title) {
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
                                  _selectedTitle = newValue;
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
                        const SizedBox(width: 15),
                        Expanded(
                          flex: 3,
                          child: TextFormField(
                            focusNode: _firstnameFocusNode,
                            controller: firstnameField,
                            decoration: const InputDecoration(
                              prefixIcon: Padding(
                                padding: EdgeInsets.only(
                                  left: 0,
                                  right: 10,
                                ),
                                child: Icon(Icons.face),
                              ),
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
                              fontSize: 17.0,
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Required';
                              }
                              return null;
                            },
                            keyboardType: TextInputType.text,
                            textInputAction: TextInputAction.next,
                            onFieldSubmitted: (_) => _focusOnLastname(),
                          ),
                        ),
                        const SizedBox(width: 15),
                        Expanded(
                          flex: 3,
                          child: TextFormField(
                            focusNode: _lastnameFocusNode,
                            controller: lastnameField,
                            decoration: const InputDecoration(
                              prefixIcon: Padding(
                                padding: EdgeInsets.only(
                                  left: 0,
                                  right: 10,
                                ),
                                child: Icon(Icons.face),
                              ),
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
                              fontSize: 17.0,
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
                    const SizedBox(height: 30),
                    Text(
                      "Email address",
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 14.0,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(
                      height: 8.0,
                    ),
                    TextFormField(
                      focusNode: _emailFocusNode,
                      controller: emailField,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        prefixIcon: Padding(
                          padding: EdgeInsets.only(
                            left: 0,
                            right: 10.0,
                          ),
                          child: Icon(Icons.email),
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
                        fontSize: 17.0,
                      ),
                    ),
                    const SizedBox(
                      height: 30.0,
                    ),
                    Text(
                      "Phone number",
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 14.0,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(
                      height: 8.0,
                    ),
                    InternationalPhoneField(
                      focusNode: _phoneFocusNode,
                      controller: phoneField,
                    ),
                    const SizedBox(
                      height: 30.0,
                    ),
                    Text(
                      "Gender & Date of birth",
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 14.0,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(
                      height: 8.0,
                    ),
                    Padding(
                      padding: const EdgeInsets.only(left: 8.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 1,
                            child: Theme(
                              data: Theme.of(context).copyWith(
                                popupMenuTheme: PopupMenuThemeData(
                                  menuPadding: EdgeInsets.symmetric(horizontal: 8.0),
                                ),
                              ),
                              child: DropdownButtonFormField<String>(
                                value: _selectedGender,
                                decoration: const InputDecoration(
                                  contentPadding: EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  prefixIcon: Padding(
                                    padding: EdgeInsets.only(right: 10.0),
                                    child: Icon(Icons.person),
                                  ),
                                  prefixIconConstraints: BoxConstraints(
                                    minWidth: 0,
                                    minHeight: 0,
                                  ),
                                  hintText: 'Gender',
                                ),
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 17.0,
                                ),
                                hint: const Text('Gender'),
                                isExpanded: true,
                                icon: const Icon(Icons.arrow_drop_down),
                                menuMaxHeight: 300,
                                alignment: AlignmentDirectional.centerStart,
                                items: _genderOptions.map((String gender) {
                                  return DropdownMenuItem<String>(
                                    value: gender,
                                    child: Padding(
                                      padding: const EdgeInsets.only(left: 8.0),
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
                          const SizedBox(width: 15),
                          Expanded(
                            flex: 1,
                            child: GestureDetector(
                              onTap: () => _selectDate(context),
                              child: AbsorbPointer(
                                child: TextFormField(
                                  focusNode: _dobFocusNode,
                                  controller: dobField,
                                  decoration: const InputDecoration(
                                    prefixIcon: Padding(
                                      padding: EdgeInsets.only(
                                        left: 0,
                                        right: 10,
                                      ),
                                      child: Icon(Icons.calendar_today),
                                    ),
                                    hintText: 'Date of Birth',
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
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Required';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(
                      height: 40.0,
                    ),
                    ElevatedButton(
                      onPressed: _isloading ? null : _update,
                      style: ButtonStyle(
                        backgroundColor: WidgetStatePropertyAll(AppColors.accentColor),
                        foregroundColor: WidgetStatePropertyAll(Colors.white),
                        shape: WidgetStatePropertyAll<RoundedRectangleBorder>(
                          const RoundedRectangleBorder(
                            borderRadius: BorderRadius.all(Radius.circular(30.0)),
                          ),
                        ),
                        minimumSize: WidgetStatePropertyAll(const Size(190.0, 50.0)),
                      ),
                      child: _isloading
                          ? const Row(
                              mainAxisAlignment: MainAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
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
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  "Update Profile",
                                  style: TextStyle(
                                    fontSize: 16.0,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.2,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
