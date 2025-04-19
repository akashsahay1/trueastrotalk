import 'package:flutter/material.dart';
import 'package:trueastrotalk/models/review.dart';

class AstrologerReviewCard extends StatelessWidget {
  final Review review;

  const AstrologerReviewCard({
    Key? key,
    required this.review,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      margin: EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              mainAxisSize: MainAxisSize.max,
              children: [
                Text(
                  review.customer_name,
                  style: TextStyle(
                    fontSize: 16.0,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                    letterSpacing: 0.0,
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  mainAxisSize: MainAxisSize.max,
                  children: List.generate(5, (index) {
                    return Icon(
                      // Show filled star if index is less than rating
                      index < review.rating ? Icons.star : Icons.star_border,
                      color: index < review.rating ? Colors.amber : Colors.grey,
                      size: 18.0,
                    );
                  }),
                )
              ],
            ),
            SizedBox(height: 10),
            Text(
              review.reviewText,
              style: TextStyle(
                fontSize: 15.0,
                letterSpacing: 0.0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
