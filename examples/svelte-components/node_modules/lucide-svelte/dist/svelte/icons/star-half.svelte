<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M12 17.8 5.8 21 7 14.1 2 9.3l7-1L12 2" }]];
</script>

<Icon name="star-half" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
