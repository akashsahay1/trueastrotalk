import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/order.dart';

class OrderSuccessScreen extends StatelessWidget {
  final Order order;

  const OrderSuccessScreen({
    super.key,
    required this.order,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text('Order Placed', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.success,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Dimensions.paddingLg),
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      const SizedBox(height: Dimensions.spacingXl),
                      _buildSuccessIcon(),
                      const SizedBox(height: Dimensions.spacingLg),
                      _buildSuccessMessage(),
                      const SizedBox(height: Dimensions.spacingXl),
                      _buildOrderSummaryCard(),
                      const SizedBox(height: Dimensions.spacingLg),
                      _buildDeliveryInfoCard(),
                      const SizedBox(height: Dimensions.spacingLg),
                      _buildPaymentInfoCard(),
                    ],
                  ),
                ),
              ),
              _buildActionButtons(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessIcon() {
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: const Icon(
        Icons.check_circle,
        size: 60,
        color: AppColors.success,
      ),
    );
  }

  Widget _buildSuccessMessage() {
    return Column(
      children: [
        Text(
          'Order Placed Successfully!',
          style: AppTextStyles.heading4.copyWith(
            color: AppColors.success,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: Dimensions.spacingSm),
        Text(
          'Thank you for your order. We\'ll send you a confirmation email shortly.',
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textSecondaryLight,
          ),
          textAlign: TextAlign.center,
        ),
        if (order.orderNumber != null) ...[
          const SizedBox(height: Dimensions.spacingMd),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Dimensions.paddingMd,
              vertical: Dimensions.paddingSm,
            ),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(Dimensions.radiusSm),
            ),
            child: Text(
              'Order #${order.orderNumber}',
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildOrderSummaryCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.shopping_bag, color: AppColors.primary, size: 20),
                const SizedBox(width: Dimensions.spacingSm),
                Text(
                  'Order Summary',
                  style: AppTextStyles.heading6.copyWith(
                    color: AppColors.textPrimaryLight,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.spacingMd),
            
            // Order items
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: order.items.length,
              separatorBuilder: (context, index) => const Divider(),
              itemBuilder: (context, index) {
                final item = order.items[index];
                return Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                      child: Container(
                        width: 50,
                        height: 50,
                        color: AppColors.grey100,
                        child: item.productImage?.isNotEmpty == true
                            ? Image.network(
                                item.productImage!,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => const Icon(
                                  Icons.image,
                                  size: 20,
                                  color: AppColors.grey400,
                                ),
                              )
                            : const Icon(Icons.image, size: 20, color: AppColors.grey400),
                      ),
                    ),
                    const SizedBox(width: Dimensions.spacingMd),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.productName,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimaryLight,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${item.formattedPrice} × ${item.quantity}',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      item.formattedTotalPrice,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                );
              },
            ),
            
            const Divider(),
            
            // Price breakdown
            _buildPriceRow('Subtotal', order.formattedSubtotal),
            _buildPriceRow('Shipping', order.formattedShipping),
            _buildPriceRow('Tax (GST)', order.formattedTax),
            
            const Divider(),
            
            _buildPriceRow('Total', order.formattedTotal, isTotal: true),
          ],
        ),
      ),
    );
  }

  Widget _buildDeliveryInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.local_shipping, color: AppColors.primary, size: 20),
                const SizedBox(width: Dimensions.spacingSm),
                Text(
                  'Delivery Information',
                  style: AppTextStyles.heading6.copyWith(
                    color: AppColors.textPrimaryLight,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.spacingMd),
            
            _buildInfoRow('Delivery Address', order.shippingAddress.shortAddress),
            _buildInfoRow('Expected Delivery', order.formattedDeliveryDate),
            if (order.trackingNumber != null)
              _buildInfoRow('Tracking Number', order.trackingNumber!),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.payment, color: AppColors.primary, size: 20),
                const SizedBox(width: Dimensions.spacingSm),
                Text(
                  'Payment Information',
                  style: AppTextStyles.heading6.copyWith(
                    color: AppColors.textPrimaryLight,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.spacingMd),
            
            _buildInfoRow('Payment Method', order.paymentMethodDisplayName),
            _buildInfoRow('Payment Status', order.paymentStatusDisplayName),
            if (order.paymentId != null)
              _buildInfoRow('Payment ID', order.paymentId!),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: AppTextStyles.bodyMedium.copyWith(
              color: isTotal ? AppColors.textPrimaryLight : AppColors.textSecondaryLight,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: AppTextStyles.bodyMedium.copyWith(
              color: isTotal ? AppColors.primary : AppColors.textPrimaryLight,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondaryLight,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: Dimensions.spacingMd),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textPrimaryLight,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              Navigator.pushNamedAndRemoveUntil(context, '/orders', (route) => false);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Dimensions.radiusMd),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.list_alt, size: 20),
                const SizedBox(width: Dimensions.spacingSm),
                Text(
                  'View My Orders',
                  style: AppTextStyles.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: Dimensions.spacingMd),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () {
              Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.primary),
              padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Dimensions.radiusMd),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.home, size: 20),
                const SizedBox(width: Dimensions.spacingSm),
                Text(
                  'Continue Shopping',
                  style: AppTextStyles.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}