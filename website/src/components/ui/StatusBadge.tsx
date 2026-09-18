import { CheckCircle2, Clock, XCircle, AlertCircle, ChefHat, Truck, Navigation, Package } from 'lucide-react';

type StatusType = 'order' | 'payment';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

export default function StatusBadge({ status, type = 'order', className = '' }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase();

  const getOrderBadge = () => {
    switch (normalizedStatus) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-3 h-3 mr-1" />, label: 'Pending' };
      case 'restaurant_confirmed':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle2 className="w-3 h-3 mr-1" />, label: 'Confirmed' };
      case 'preparing':
        return { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <ChefHat className="w-3 h-3 mr-1" />, label: 'Preparing' };
      case 'ready':
        return { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: <Package className="w-3 h-3 mr-1" />, label: 'Ready' };
      case 'rider_assigned':
        return { color: 'bg-teal-100 text-teal-800 border-teal-200', icon: <Truck className="w-3 h-3 mr-1" />, label: 'Rider Assigned' };
      case 'picked_up':
      case 'out_for_delivery':
        return { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: <Navigation className="w-3 h-3 mr-1" />, label: 'On the Way' };
      case 'delivered':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="w-3 h-3 mr-1" />, label: 'Delivered' };
      case 'cancelled':
      case 'rejected':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-3 h-3 mr-1" />, label: normalizedStatus === 'rejected' ? 'Rejected' : 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <AlertCircle className="w-3 h-3 mr-1" />, label: status || 'Unknown' };
    }
  };

  const getPaymentBadge = () => {
    switch (normalizedStatus) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Payment Pending' };
      case 'processing':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Processing' };
      case 'success':
      case 'completed': // legacy fallback
        return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Paid' };
      case 'failed':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Payment Failed' };
      case 'refunded':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Refunded' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status || 'Unknown' };
    }
  };

  const config = type === 'order' ? getOrderBadge() : getPaymentBadge();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.color} ${className}`}>
      {('icon' in config) && (config as any).icon}
      {config.label}
    </span>
  );
}
